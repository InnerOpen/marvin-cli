/**
 * `marvin platform dashboard` — what needs attention in the workspace (entries in the inbox, drafts,
 * entries waiting for review, pending AI suggestions, failures in the last 7 days) and the latest
 * activity. Any member may read it.
 */

import { Command } from "commander";
import { clientFactory } from "../../shared/clients.js";
import { renderData, renderTable } from "../../output.js";
import { getOutputMode, type PlatformCommandOptions } from "../../shared/types.js";
import { handleCommandError } from "../../shared/error-handler.js";
import { TABLE_SCHEMAS } from "../../shared/table-schemas.js";

/** Attention counts in display order, with the command that works through each. */
const ATTENTION = [
  ["inbox", "Inbox", "marvin platform entries list --status inbox"],
  ["drafts", "Drafts", "marvin platform entries list --status draft"],
  ["needsReview", "Needs review", "marvin platform entries list --status needs_review"],
  ["aiSuggestions", "AI suggestions", "marvin platform entries list --suggestions"],
  ["failures", "Failures (7 days)", "marvin platform ai executions list --status failed (and scheduled-tasks history, webhooks logs)"],
] as const;

function line(text = ""): void {
  process.stdout.write(`${text}\n`);
}

export function registerDashboardCommand(parent: Command): void {
  parent
    .command("dashboard")
    .description("What needs attention (inbox, drafts, review, AI suggestions, failures) and recent activity")
    .action(async function(this: Command) {
      try {
        const opts = this.optsWithGlobals<PlatformCommandOptions>();
        const mode = getOutputMode(opts);
        const client = await clientFactory.createPlatformClient(opts);
        const dashboard = await client.workspaces.getDashboard();

        if (mode !== "table") {
          renderData(dashboard, mode);
          return;
        }

        const attention = dashboard.attention as unknown as Record<string, number>;
        const total = ATTENTION.reduce((n, [key]) => n + (attention[key] ?? 0), 0);
        line(total === 0 ? "Needs attention: nothing" : `Needs attention: ${total}`);
        renderTable(
          ATTENTION.map(([key, label, command]) => ({ label, count: attention[key] ?? 0, command })),
          { Item: "label", Count: "count", "See it with": (r) => (r.count ? r.command : "") },
        );
        line();
        line("Recent activity");
        renderTable(dashboard.recentActivity ?? [], TABLE_SCHEMAS["dashboard.activity"]);
      } catch (error) {
        handleCommandError(error);
      }
    });
}
