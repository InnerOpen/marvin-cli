/**
 * `marvin platform site` — rebuild the workspace's static site.
 *
 * A request joins the workspace's pending rebuild, which goes to the deploy target (an outgoing
 * webhook or integration action subscribed to `webhook_triggered`) once requests have been quiet
 * for the server's SITE_REBUILD_QUIET_SECONDS, so repeated calls cost one build. EDITOR and above.
 */

import { Command } from "commander";
import type { SiteRebuildStatus, SiteRebuildTarget } from "@inneropen/marvin-sdk/platform";
import { clientFactory } from "../../shared/clients.js";
import { renderData } from "../../output.js";
import { getOutputMode, type PlatformCommandOptions } from "../../shared/types.js";
import { handleCommandError } from "../../shared/error-handler.js";
import { emitOk } from "../../shared/io.js";

function describeTarget(t: SiteRebuildTarget): string {
  const name = t.name ? `${t.name} ` : "";
  if (t.kind !== "integration") return `${name}(webhook)`;
  return `${name}(integration${t.provider ? `: ${t.provider}` : ""}${t.action ? ` → ${t.action}` : ""})`;
}

function line(text: string): void {
  process.stdout.write(`${text}\n`);
}

function renderStatus(s: SiteRebuildStatus): void {
  line(`Configured:  ${s.configured ? "yes" : "no — nothing is set up to build the site"}`);
  for (const t of s.targets ?? []) line(`Builds via:  ${describeTarget(t)}`);
  line(`Quiet time:  ${s.quietSeconds}s (sent at most ${s.maxWaitSeconds}s after the first request)`);
  if (s.pending) {
    const p = s.pending;
    line(`Pending:     ${p.requestCount} request(s) since ${p.queuedAt}; sends at ${p.expectedSendAt}${p.reason ? ` — ${p.reason}` : ""}`);
  } else {
    line("Pending:     none");
  }
  if (s.lastSent) line(`Last sent:   ${s.lastSent.sentAt} — ${s.lastSent.message}`);
  if (s.lastBuild) {
    const b = s.lastBuild;
    line(`Last build:  ${b.stage} ${b.status} at ${b.occurredAt} — ${b.message}${b.detail ? ` (${b.detail})` : ""}`);
  }
}

export function registerSiteCommands(parent: Command): void {
  const site = parent
    .command("site")
    .description("The workspace's static site: request a rebuild and see where it stands");

  site
    .command("rebuild")
    .description("Queue a site rebuild (joins a pending one; sent once requests go quiet)")
    .option("--reason <text>", "Why, for the build log (at most 200 characters)")
    .action(async function(this: Command, cmdOpts) {
      try {
        if (cmdOpts.reason !== undefined && String(cmdOpts.reason).length > 200) {
          throw new Error("--reason is at most 200 characters");
        }
        const opts = this.optsWithGlobals<PlatformCommandOptions>();
        const client = await clientFactory.createPlatformClient(opts);
        const result = await client.site.requestRebuild(cmdOpts.reason);
        const via = (result.targets ?? []).map(describeTarget).join(", ");
        emitOk(result, getOutputMode(opts),
          `✓ Rebuild queued${result.requestCount > 1 ? ` (joins ${result.requestCount - 1} earlier request(s))` : ""}: sends at ${result.expectedSendAt}`,
          ...(via ? [`  via ${via}`] : []),
          `  reason: ${result.reason}`);
      } catch (error) {
        handleCommandError(error);
      }
    });

  site
    .command("rebuild-status")
    .description("What builds the site, the pending rebuild, the last one sent, and the newest build event")
    .action(async function(this: Command) {
      try {
        const opts = this.optsWithGlobals<PlatformCommandOptions>();
        const mode = getOutputMode(opts);
        const client = await clientFactory.createPlatformClient(opts);
        const status = await client.site.rebuildStatus();
        if (mode === "table") renderStatus(status);
        else renderData(status, mode);
      } catch (error) {
        handleCommandError(error);
      }
    });
}
