/**
 * `marvin platform workflows` — the workspace's workflows (the API and SDK call them automations):
 * a trigger, an optional target query, conditions, and a list of actions. Every route needs
 * workspace ADMIN.
 */

import { Command } from "commander";
import type {
  AutomationActionExecution,
  AutomationDefinition,
  AutomationExecution,
  AutomationExecutionDetail,
  PlatformClient,
} from "@inneropen/marvin-sdk/platform";
import { clientFactory } from "../../shared/clients.js";
import { renderData, renderList, renderTable, type OutputMode } from "../../output.js";
import { getOutputMode, type PlatformCommandOptions } from "../../shared/types.js";
import { handleCommandError } from "../../shared/error-handler.js";
import { TABLE_SCHEMAS } from "../../shared/table-schemas.js";
import { addDataOptions, readJsonInput } from "../../shared/json-input.js";
import { say, warn, emitDeleted, emitOk } from "../../shared/io.js";
import { validatePositiveInteger } from "../../shared/validation.js";

/** A retry the integration error policy queued for a failed step (`retries` on a run's detail). */
interface IntegrationRetry {
  id: string;
  status: string;
  integrationSlug: string;
  action: string;
  code: string;
  stepIndex: number;
  attempt: number;
  maxAttempts: number;
  nextAttemptAt?: string | null;
  lastError?: string | null;
}

/** What the API returns for one run; SDK 4.0's type predates the error-handling fields. */
type ExecutionDetail = AutomationExecutionDetail & {
  handled?: boolean;
  retryOfId?: string | null;
  retryChain?: (AutomationExecution & { handled?: boolean; retryOfId?: string | null })[];
  retries?: IntegrationRetry[];
  actions: (AutomationActionExecution & { handling?: { summary?: string } & Record<string, unknown> | null })[];
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** The API takes ids; accept a slug too and look it up. */
async function resolveWorkflowId(client: PlatformClient, ref: string): Promise<string> {
  if (UUID.test(ref)) return ref;
  const match = (await client.automations.list()).find((w) => w.slug === ref);
  if (!match) throw new Error(`No workflow with id or slug '${ref}'`);
  return match.id;
}

/**
 * The definition to validate or preview: from --data (a bare definition, or a workflow body with
 * a `definition`), else the saved definition of the workflow named on the command line.
 */
async function definitionFrom(client: PlatformClient, ref: string | undefined, cmdOpts: any): Promise<AutomationDefinition> {
  if (cmdOpts.data !== undefined || cmdOpts.file) {
    const body = await readJsonInput(cmdOpts);
    return (body.definition ?? body) as AutomationDefinition;
  }
  if (!ref) throw new Error("Name a workflow (id or slug) or pass a definition with --data");
  const workflow = await client.automations.get(await resolveWorkflowId(client, ref));
  return workflow.definition;
}

function formatMs(ms: number | null | undefined): string {
  if (ms === null || ms === undefined) return "";
  return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`;
}

const STEP_COLUMNS = {
  Target: (s: ExecutionDetail["actions"][number]) =>
    s.targetEntityId ? `${s.targetEntityType ?? ""} ${s.targetEntityId}`.trim() : `#${s.targetIndex}`,
  Step: (s: ExecutionDetail["actions"][number]) => s.actionIndex,
  Kind: (s: ExecutionDetail["actions"][number]) => s.kind,
  Label: (s: ExecutionDetail["actions"][number]) => s.label ?? "",
  Status: (s: ExecutionDetail["actions"][number]) => s.status,
  Duration: (s: ExecutionDetail["actions"][number]) => formatMs(s.durationMs),
  Error: (s: ExecutionDetail["actions"][number]) => s.error ?? "",
  Handling: (s: ExecutionDetail["actions"][number]) =>
    s.handling ? (typeof s.handling.summary === "string" ? s.handling.summary : JSON.stringify(s.handling)) : "",
};

const RETRY_COLUMNS = {
  ID: (r: IntegrationRetry) => r.id,
  Status: (r: IntegrationRetry) => r.status,
  Integration: (r: IntegrationRetry) => r.integrationSlug,
  Action: (r: IntegrationRetry) => r.action,
  Code: (r: IntegrationRetry) => r.code,
  Step: (r: IntegrationRetry) => r.stepIndex,
  Attempt: (r: IntegrationRetry) => `${r.attempt}/${r.maxAttempts}`,
  "Next attempt": (r: IntegrationRetry) => r.nextAttemptAt ?? "",
  "Last error": (r: IntegrationRetry) => r.lastError ?? "",
};

function line(text = ""): void {
  process.stdout.write(`${text}\n`);
}

/** Table mode for one run: a summary, the per-step records, then the retry chain and queued retries. */
function renderExecution(detail: ExecutionDetail): void {
  line(`Run ${detail.id} — ${detail.automationSlug}`);
  line(`  Status:   ${detail.status}${detail.handled ? " (handled)" : ""}`);
  line(`  Trigger:  ${detail.triggerType}`);
  line(`  Started:  ${detail.startedAt ?? ""}${detail.durationMs != null ? `  (${formatMs(detail.durationMs)})` : ""}`);
  line(`  Targets:  ${detail.targetsRun}/${detail.targetsMatched} run${detail.capped ? " (capped)" : ""}`);
  line(`  Steps:    ${detail.stepsOk} ok, ${detail.stepsFailed} failed, ${detail.stepsTotal} total`);
  if (detail.retryOfId) line(`  Retry of: ${detail.retryOfId}`);
  if (detail.error) line(`  Error:    ${detail.error}`);

  line();
  line("Steps");
  renderTable(detail.actions ?? [], STEP_COLUMNS);

  if (detail.retryChain?.length) {
    line();
    line("Retry chain (oldest first)");
    renderTable(detail.retryChain, TABLE_SCHEMAS["workflows.executions"]);
  }
  if (detail.retries?.length) {
    line();
    line("Integration retries");
    renderTable(detail.retries, RETRY_COLUMNS);
  }
}

export function registerWorkflowCommands(parent: Command): void {
  const workflows = parent
    .command("workflows")
    .alias("automations")
    .description("Workflows: a trigger, conditions and actions that run on events, a schedule, or on demand");

  const optsOf = (cmd: Command) => cmd.optsWithGlobals<PlatformCommandOptions>();

  workflows
    .command("list")
    .description("List the workspace's workflows")
    .action(async function(this: Command) {
      try {
        const opts = optsOf(this);
        const client = await clientFactory.createPlatformClient(opts);
        const items = await client.automations.list();
        renderList(items, TABLE_SCHEMAS["workflows.list"], getOutputMode(opts));
      } catch (error) {
        handleCommandError(error);
      }
    });

  workflows
    .command("get <workflow>")
    .description("Show a workflow (id or slug) with its definition")
    .action(async function(this: Command, ref: string) {
      try {
        const opts = optsOf(this);
        const client = await clientFactory.createPlatformClient(opts);
        const workflow = await client.automations.get(await resolveWorkflowId(client, ref));
        renderData(workflow, getOutputMode(opts));
      } catch (error) {
        handleCommandError(error);
      }
    });

  workflows
    .command("options")
    .description("The builder's vocabulary: trigger types, condition fields and ops, action kinds, operations")
    .action(async function(this: Command) {
      try {
        const opts = optsOf(this);
        const client = await clientFactory.createPlatformClient(opts);
        renderData(await client.automations.options(), getOutputMode(opts));
      } catch (error) {
        handleCommandError(error);
      }
    });

  addDataOptions(workflows
    .command("create")
    .description("Create a workflow from {name, slug?, enabled?, definition} (created disabled unless enabled: true)"),
    "the workflow")
    .action(async function(this: Command, cmdOpts) {
      try {
        const data = await readJsonInput(cmdOpts);
        const opts = optsOf(this);
        const client = await clientFactory.createPlatformClient(opts);
        const workflow = await client.automations.create(data);
        say(`✓ Created workflow: ${workflow.slug} (${workflow.id})${workflow.enabled ? "" : " — disabled; enable it to run"}`);
        renderData(workflow, getOutputMode(opts));
      } catch (error) {
        handleCommandError(error);
      }
    });

  addDataOptions(workflows
    .command("update <workflow>")
    .description("Update a workflow's name, enabled flag or definition"), "the fields to change")
    .action(async function(this: Command, ref: string, cmdOpts) {
      try {
        const data = await readJsonInput(cmdOpts);
        const opts = optsOf(this);
        const client = await clientFactory.createPlatformClient(opts);
        const workflow = await client.automations.update(await resolveWorkflowId(client, ref), data);
        say(`✓ Updated workflow: ${workflow.slug} (${workflow.id})`);
        renderData(workflow, getOutputMode(opts));
      } catch (error) {
        handleCommandError(error);
      }
    });

  workflows
    .command("delete <workflow>")
    .description("Delete a workflow")
    .option("--yes", "Confirm the delete")
    .action(async function(this: Command, ref: string, cmdOpts) {
      try {
        if (!cmdOpts.yes) {
          console.error("Error: Delete requires --yes confirmation flag");
          process.exitCode = 1;
          return;
        }
        const opts = optsOf(this);
        const client = await clientFactory.createPlatformClient(opts);
        const id = await resolveWorkflowId(client, ref);
        await client.automations.delete(id);
        emitDeleted(id, getOutputMode(opts), `✓ Deleted workflow: ${ref}`);
      } catch (error) {
        handleCommandError(error);
      }
    });

  for (const [name, enabled] of [["enable", true], ["disable", false]] as const) {
    workflows
      .command(`${name} <workflow>`)
      .description(enabled ? "Turn a workflow on (its trigger starts firing)" : "Turn a workflow off (it stops firing and can't be run)")
      .action(async function(this: Command, ref: string) {
        try {
          const opts = optsOf(this);
          const client = await clientFactory.createPlatformClient(opts);
          const workflow = await client.automations.update(await resolveWorkflowId(client, ref), { enabled });
          say(`✓ ${enabled ? "Enabled" : "Disabled"} workflow: ${workflow.slug}`);
          renderData(workflow, getOutputMode(opts));
        } catch (error) {
          handleCommandError(error);
        }
      });
  }

  addDataOptions(workflows
    .command("validate [workflow]")
    .description("Check a definition for steps that use data the trigger doesn't provide (exit 1 on errors)"),
    "a definition (or a workflow body with one)")
    .action(async function(this: Command, ref: string | undefined, cmdOpts) {
      try {
        const opts = optsOf(this);
        const mode = getOutputMode(opts);
        const client = await clientFactory.createPlatformClient(opts);
        const result = await client.automations.validate(await definitionFrom(client, ref, cmdOpts));
        const issues = result.issues ?? [];
        if (mode === "table") {
          if (issues.length === 0) say("✓ No issues");
          else renderList(issues, { Level: "level", Where: "where", Index: (i) => i.index ?? "", Message: "message" }, mode);
        } else {
          renderData(result, mode);
        }
        if (issues.some((i) => i.level === "error")) process.exitCode = 1;
      } catch (error) {
        handleCommandError(error);
      }
    });

  addDataOptions(workflows
    .command("preview [workflow]")
    .description("Show which entities a definition's target query would act on, without running anything"),
    "a definition (or a workflow body with one)")
    .option("--payload <json>", "Test payload for the target query, as JSON")
    .action(async function(this: Command, ref: string | undefined, cmdOpts) {
      try {
        const payload = cmdOpts.payload === undefined ? undefined : JSON.parse(cmdOpts.payload);
        const opts = optsOf(this);
        const mode = getOutputMode(opts);
        const client = await clientFactory.createPlatformClient(opts);
        const result = await client.automations.preview(await definitionFrom(client, ref, cmdOpts), payload);
        if (mode !== "table") {
          renderData(result, mode);
          return;
        }
        if (result.error) warn(result.error);
        if (!result.hasTarget) {
          say("This definition has no target query: its actions run once, without a target.");
          return;
        }
        say(`${result.total} ${result.entity}(s) match the query${result.capped ? " (capped)" : ""}; ${result.matches.length} also pass the conditions:`);
        renderList(result.matches, { ID: "id", Type: (m) => m.entryType ?? "", Status: (m) => m.status ?? "", Title: (m) => m.title ?? "", Slug: (m) => m.slug ?? "" }, mode);
      } catch (error) {
        handleCommandError(error);
      }
    });

  workflows
    .command("run <workflow>")
    .description("Run a workflow now, skipping its trigger and conditions; --dry-run shows what it would do")
    .option("--dry-run", "Resolve every step's inputs but execute and record nothing (works on a disabled workflow)")
    .option("--entry-id <id>", "With --dry-run: test an event-triggered workflow against this entry's latest event")
    .option("--event-id <id>", "With --dry-run: test an event-triggered workflow against this event")
    .action(async function(this: Command, ref: string, cmdOpts) {
      try {
        if ((cmdOpts.entryId || cmdOpts.eventId) && !cmdOpts.dryRun) {
          throw new Error("--entry-id and --event-id pick a sample for --dry-run; add --dry-run");
        }
        if (cmdOpts.entryId && cmdOpts.eventId) throw new Error("Pass --entry-id or --event-id, not both");

        const opts = optsOf(this);
        const mode = getOutputMode(opts);
        const client = await clientFactory.createPlatformClient(opts);
        const id = await resolveWorkflowId(client, ref);

        if (!cmdOpts.dryRun) {
          const result = await client.automations.run(id);
          emitOk(result, mode, `${result.ok ? "✓" : "✗"} Ran workflow ${ref}: ${result.status}, ${result.ran} target(s)`);
          if (!result.ok) process.exitCode = 1;
          return;
        }

        const result = await client.automations.dryRun(id, { entryId: cmdOpts.entryId, eventId: cmdOpts.eventId });
        if (mode !== "table") {
          emitOk(result, mode);
          return;
        }
        if (result.sample !== undefined) {
          say(result.sample
            ? `Sample: ${result.sample.kind} ${result.sample.id}${result.sample.label ? ` (${result.sample.label})` : ""}${result.sample.synthesized ? " — built for this dry run" : ""}`
            : "Sample: none found (no matching event yet)");
          if (result.trigger_matched !== undefined) say(`Trigger matched: ${result.trigger_matched ? "yes" : "no"}`);
          if (result.conditions_pass !== undefined) say(`Conditions pass: ${result.conditions_pass ? "yes" : "no"}`);
          if (result.would_fire !== undefined) say(`Would fire: ${result.would_fire ? "yes" : "no"}`);
        }
        say(`Dry run: ${result.ran} target(s), nothing executed`);
        renderList(result.plan ?? [], TABLE_SCHEMAS["workflows.plan"], mode);
      } catch (error) {
        handleCommandError(error);
      }
    });

  workflows
    .command("executions <workflow>")
    .alias("runs")
    .description("Recent runs of a workflow, newest first")
    .option("--status <status>", "Only runs with this status: running, success, partial, failed — or handled (failures the error policy took care of)")
    .option("--limit <number>", "How many recent runs to fetch", "20")
    .action(async function(this: Command, ref: string, cmdOpts) {
      try {
        const limit = validatePositiveInteger(cmdOpts.limit, "--limit");
        const opts = optsOf(this);
        const client = await clientFactory.createPlatformClient(opts);
        let runs = await client.automations.executions(await resolveWorkflowId(client, ref), limit);
        if (cmdOpts.status) {
          // The API has no status filter; filter the fetched page (so --limit counts before filtering)
          const want = String(cmdOpts.status).toLowerCase();
          runs = runs.filter((r) =>
            r.status.toLowerCase() === want || (want === "handled" && (r as { handled?: boolean }).handled === true));
        }
        renderList(runs, TABLE_SCHEMAS["workflows.executions"], getOutputMode(opts));
      } catch (error) {
        handleCommandError(error);
      }
    });

  workflows
    .command("execution <workflow> <execution-id>")
    .alias("run-detail")
    .description("One run: its steps, how failures were handled, and its retry chain")
    .action(async function(this: Command, ref: string, executionId: string) {
      try {
        const opts = optsOf(this);
        const mode: OutputMode = getOutputMode(opts);
        const client = await clientFactory.createPlatformClient(opts);
        const detail = (await client.automations.execution(await resolveWorkflowId(client, ref), executionId)) as ExecutionDetail;
        if (mode === "table") renderExecution(detail);
        else renderData(detail, mode);
      } catch (error) {
        handleCommandError(error);
      }
    });
}
