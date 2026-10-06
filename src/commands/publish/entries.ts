import { handleCommandError } from '../../shared/error-handler.js';
import { Command } from "commander";
import { clientFactory } from "../../shared/clients.js";
import { renderList } from "../../output.js";
import { getOutputMode, type PublishCommandOptions } from "../../shared/types.js";
import { entryColumns } from "../../shared/columns.js";
import { Entry } from "@inneropen/marvin-sdk";

export function registerEntryCommands(parent: Command): void {
  // List entries
  parent
    .command("entries")
    .description("List published entries")
    .option("--entry-type <slug>", "Filter by entry type slug")
    .option("--collection <slug>", "Filter by collection slug")
    .option("--tag <slugs>", "Only entries carrying any of these tag slugs (comma-separated)")
    .option("--slug <slugs>", "Only these entry slugs (comma-separated)")
    .option("--updated-since <iso>", "Only entries updated at or after this ISO 8601 time")
    .option("--expand <mode>", "full: return each entry as the single-entry read (assets, resources, memberships)")
    .option("--limit <number>", "Limit", (v) => Number(v))
    .option("--offset <number>", "Offset", (v) => Number(v))
    .action(async function(this: Command, cmdOpts) {
      try {
        if (cmdOpts.expand !== undefined && cmdOpts.expand !== "full") {
          throw new Error("--expand takes one value: full");
        }
        if (cmdOpts.updatedSince !== undefined && Number.isNaN(Date.parse(cmdOpts.updatedSince))) {
          throw new Error("--updated-since must be an ISO 8601 date or date-time, e.g. 2026-10-01T00:00:00Z");
        }
        const opts = this.optsWithGlobals<PublishCommandOptions>();

        // Normalize token option
        if (!opts.token && (opts as any).siteToken) {
          opts.token = (opts as any).siteToken;
        }

        const client = clientFactory.createPublishClient(opts);
        const entries = await client.entries.list({
          entryType: cmdOpts.entryType,
          collection: cmdOpts.collection,
          tag: cmdOpts.tag,
          slug: cmdOpts.slug,
          updatedSince: cmdOpts.updatedSince,
          limit: cmdOpts.limit,
          offset: cmdOpts.offset,
          ...(cmdOpts.expand ? { expand: "full" as const } : {}),
        });

        // Expanded entries are SDK Entry objects; print their data, not the wrapper.
        const rows = entries.map((e) => (e instanceof Entry ? e.toJSON() : e));
        renderList(rows, entryColumns, getOutputMode(opts));
      } catch (error) {
        handleCommandError(error);
        process.exitCode = 1;
      }
    });

  // Get single entry
  parent
    .command("entry <slug>")
    .description("Fetch one entry by slug")
    .action(async function(this: Command, slug: string) {
      try {
        const opts = this.optsWithGlobals<PublishCommandOptions>();

        // Normalize token option
        if (!opts.token && (opts as any).siteToken) {
          opts.token = (opts as any).siteToken;
        }

        const client = clientFactory.createPublishClient(opts);
        const entry = await client.entries.get(slug);

        renderList(entry ? [entry.toJSON()] : [], entryColumns, getOutputMode(opts));
      } catch (error) {
        handleCommandError(error);
        process.exitCode = 1;
      }
    });
}
