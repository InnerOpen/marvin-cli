/**
 * `marvin events` — the Events hub: for each event type in the workspace, what sends it, what
 * reacts to it and when it last happened. Workspace OWNER/ADMIN (see shared/permissions.ts).
 *
 * Not to be confused with `marvin platform event-log` (alias `platform events`), which lists the
 * individual events that happened.
 */

import { Command } from "commander";
import chalk from "chalk";
import { MarvinApiError, MarvinError } from "@inneropen/marvin-sdk";
import type {
  EventConnectionCounts,
  EventConnections,
  EventOption,
  EventReaction,
  EventSender,
  EventInstalledBy,
} from "@inneropen/marvin-sdk/platform";
import { clientFactory } from "../../shared/clients.js";
import { renderData, renderList } from "../../output.js";
import { getOutputMode, type PlatformCommandOptions } from "../../shared/types.js";
import { handleCommandError } from "../../shared/error-handler.js";
import { validatePositiveInteger } from "../../shared/validation.js";
import { TABLE_SCHEMAS, type EventTypeRow } from "../../shared/table-schemas.js";

/** The backend caps `limit` on the detail route at 50. */
const MAX_RECENT = 50;

const SENDER_LABELS: Record<string, string> = {
  marvin: "Marvin",
  workflow: "Workflow",
  incoming_webhook: "Incoming webhook",
  scheduled_task: "Scheduled task",
};

/** Reaction groups in display order; built-ins always last, unknown kinds just before them. */
const REACTION_GROUPS: ReadonlyArray<readonly [string, string]> = [
  ["workflow", "Workflows"],
  ["integration_action", "Integration actions"],
  ["webhook", "Webhooks"],
  ["email", "Emails"],
];
const BUILTIN = "builtin";

function line(text = ""): void {
  process.stdout.write(`${text}\n`);
}

function onOff(enabled: boolean): string {
  return enabled ? chalk.green("on ") : chalk.yellow("off");
}

function installedBy(by: EventInstalledBy | null | undefined): string {
  return by ? `installed by ${by.name}` : "";
}

/** "name — detail · installed by X", leaving out whatever is missing. */
function summarize(name: string, detail: string | null | undefined, by: EventInstalledBy | null | undefined): string {
  const extras = [detail, installedBy(by)].filter(Boolean).join(" · ");
  return extras ? `${name} ${chalk.dim(`— ${extras}`)}` : name;
}

/** "2026-10-04T18:02:23.857Z" → "2026-10-04 18:02" (UTC). */
function shortTime(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toISOString().slice(0, 16).replace("T", " ");
}

function printSenders(senders: EventSender[]): void {
  line(chalk.bold("Sent by"));
  if (!senders.length) {
    line(chalk.dim("  nothing in this workspace"));
    return;
  }
  const labels = senders.map((s) => SENDER_LABELS[s.kind] ?? s.kind);
  const width = Math.max(...labels.map((l) => l.length));
  senders.forEach((s, i) => {
    line(`  ${onOff(s.enabled)}  ${(labels[i] ?? "").padEnd(width)}  ${summarize(s.name, s.detail, s.installedBy)}`);
  });
}

function printReactions(reactions: EventReaction[]): void {
  line(chalk.bold("What happens"));
  if (!reactions.length) {
    line(chalk.dim("  nothing reacts to it"));
    return;
  }
  const known = new Set([...REACTION_GROUPS.map(([kind]) => kind), BUILTIN]);
  const unknownKinds = [...new Set(reactions.map((r) => r.kind as string).filter((k) => !known.has(k)))];
  const groups: Array<readonly [string, string]> = [
    ...REACTION_GROUPS,
    ...unknownKinds.map((k) => [k, k] as const),
    [BUILTIN, "Built-in"],
  ];
  for (const [kind, heading] of groups) {
    const rows = reactions.filter((r) => r.kind === kind);
    if (!rows.length) continue;
    line(`  ${heading}`);
    for (const r of rows) line(`    ${onOff(r.enabled)}  ${summarize(r.name, r.detail, r.installedBy)}`);
  }
}

function printRecent(detail: EventConnections, limit: number): void {
  const recent = [...detail.recent]
    .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))
    .slice(0, limit);
  line(`${chalk.bold("Recent")} ${chalk.dim("(newest first, UTC)")}`);
  if (!detail.audited) {
    line(chalk.dim("  not recorded in the event log, so there's no history"));
    return;
  }
  if (!recent.length) {
    line(chalk.dim("  hasn't happened yet"));
    return;
  }
  for (const e of recent) {
    const what = e.messageBody || e.messageTitle;
    const label = e.relatedEntityLabel ? chalk.dim(` (${e.relatedEntityLabel})`) : "";
    line(`  ${shortTime(e.occurredAt)}  ${what}${label}`);
  }
}

function refs(list: EventConnections["leadsTo"]): string {
  return list.length ? list.map((r) => `${r.eventType} ${chalk.dim(`(${r.name})`)}`).join(", ") : chalk.dim("nothing");
}

function printDetail(detail: EventConnections, limit: number): void {
  line(`${chalk.bold(detail.name)} ${chalk.dim(`(${detail.eventType})`)}`);
  if (detail.category) line(`Category: ${detail.category}`);
  if (detail.description) line(detail.description);
  line(`Recorded in the event log: ${detail.audited ? "yes" : "no"}`);
  line();
  printSenders(detail.senders);
  line();
  printReactions(detail.reactions);
  line();
  printRecent(detail, limit);
  line();
  line(`${chalk.bold("Leads to:")} ${refs(detail.leadsTo)}`);
  line(`${chalk.bold("Caused by:")} ${refs(detail.causedBy)}`);
}

/** The summary joined with the event catalogue for each type's name and category. */
function withNames(summary: EventConnectionCounts[], catalogue: EventOption[]): EventTypeRow[] {
  const byType = new Map(catalogue.map((o) => [o.value, o]));
  return summary.map((row) => {
    const option = byType.get(row.eventType);
    const { eventType, ...counts } = row;
    return { eventType, name: option?.label ?? null, category: option?.category ?? null, ...counts };
  });
}

/** A 404 from the detail route means the type is unknown here, or a platform-scope type. */
function unknownEventType(error: unknown, eventType: string): unknown {
  if (!(error instanceof MarvinError) || error.statusCode !== 404) return error;
  const endpoint = (error as { endpoint?: string }).endpoint ?? `/api/platform/event-types/${eventType}/connections`;
  return new MarvinApiError(
    `Unknown event type '${eventType}' (or a platform event — see the admin Events page)`,
    404,
    endpoint,
  );
}

export function createEventsCommand(): Command {
  const events = new Command("events")
    .description("What sends each event type and what reacts to it (the Events hub)");

  events
    .command("list")
    .description("Every event type in the workspace with its senders, reactions and when it last happened")
    .option("--category <name>", "Only event types in this category (e.g. Content)")
    .option("--connected", "Only event types something reacts to (built-ins don't count)")
    .option("--unused", "Only event types nothing reacts to (built-ins don't count)")
    .action(async function (this: Command, cmdOpts: { category?: string; connected?: boolean; unused?: boolean }) {
      try {
        const opts = this.optsWithGlobals<PlatformCommandOptions>();
        const mode = getOutputMode(opts);
        if (cmdOpts.connected && cmdOpts.unused) {
          throw new Error("--connected and --unused can't be used together");
        }
        const client = await clientFactory.createPlatformClient(opts);
        const [summary, catalogue] = await Promise.all([
          client.events.getConnectionsSummary(),
          client.events.getOptions(),
        ]);

        const category = cmdOpts.category?.toLowerCase();
        const rows = withNames(summary, catalogue).filter(
          (r) =>
            (!category || r.category?.toLowerCase() === category) &&
            (!cmdOpts.connected || r.reactions > 0) &&
            (!cmdOpts.unused || r.reactions === 0),
        );
        renderList(rows, TABLE_SCHEMAS["events.list"], mode);
      } catch (error) {
        handleCommandError(error);
      }
    });

  events
    .command("show <event-type>")
    .description("One event type: what sends it, what happens when it does, recent events, and what it leads to")
    .option("--limit <n>", `How many recent events to show (max ${MAX_RECENT})`, "10")
    .action(async function (this: Command, eventType: string, cmdOpts: { limit: string }) {
      try {
        const opts = this.optsWithGlobals<PlatformCommandOptions>();
        const mode = getOutputMode(opts);
        const limit = validatePositiveInteger(cmdOpts.limit, "--limit");
        if (limit > MAX_RECENT) throw new Error(`--limit must be ${MAX_RECENT} or less, got: ${limit}`);
        const client = await clientFactory.createPlatformClient(opts);

        let detail: EventConnections;
        try {
          detail = await client.events.getConnections(eventType, { limit });
        } catch (error) {
          throw unknownEventType(error, eventType);
        }

        if (mode === "table") printDetail(detail, limit);
        else renderData(detail, mode);
      } catch (error) {
        handleCommandError(error);
      }
    });

  return events;
}
