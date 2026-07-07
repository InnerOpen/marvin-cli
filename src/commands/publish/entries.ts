import { Command } from "commander";
import { clientFactory } from "../../shared/clients.js";
import { renderList } from "../../output.js";
import { getOutputMode, type PublishCommandOptions } from "../../shared/types.js";
import { entryColumns } from "../../shared/columns.js";
import type { MarvinEntry } from "@inneropen/marvin-sdk/types";

export function registerEntryCommands(parent: Command): void {
  // List entries
  parent
    .command("entries")
    .description("List published entries")
    .option("--entry-type <slug>", "Filter by entry type slug")
    .option("--collection <slug>", "Filter by collection slug")
    .option("--limit <number>", "Limit", (v) => Number(v))
    .option("--offset <number>", "Offset", (v) => Number(v))
    .action(async function(this: Command, cmdOpts) {
      try {
        const opts = this.optsWithGlobals<PublishCommandOptions>();

        // Normalize token option
        if (!opts.token && (opts as any).siteToken) {
          opts.token = (opts as any).siteToken;
        }

        const client = clientFactory.createPublishClient(opts);
        const entries = await client.entries.list({
          entryType: cmdOpts.entryType,
          collection: cmdOpts.collection,
          limit: cmdOpts.limit,
          offset: cmdOpts.offset,
        });

        renderList(entries, entryColumns, getOutputMode(opts));
      } catch (error) {
        console.error(error instanceof Error ? error.message : error);
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

        renderList([entry] as MarvinEntry[], entryColumns, getOutputMode(opts));
      } catch (error) {
        console.error(error instanceof Error ? error.message : error);
        process.exitCode = 1;
      }
    });
}
