import { Command } from "commander";
import { clientFactory } from "../../shared/clients.js";
import { renderList } from "../../output.js";
import { getOutputMode, type PublishCommandOptions } from "../../shared/types.js";
import { resourceColumns, entryColumns } from "../../shared/columns.js";
import type { MarvinResource, MarvinEntry } from "@inneropen/marvin-sdk/types";

export function registerResourceCommands(parent: Command): void {
  // List resources
  parent
    .command("resources")
    .description("List resources")
    .option("--resource-type <type>", "Filter by resource type")
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
        const resources = await client.resources.list({
          resourceType: cmdOpts.resourceType,
          limit: cmdOpts.limit,
          offset: cmdOpts.offset,
        });

        renderList(resources, resourceColumns, getOutputMode(opts));
      } catch (error) {
        console.error(error instanceof Error ? error.message : error);
        process.exitCode = 1;
      }
    });

  // Get single resource
  parent
    .command("resource <slug>")
    .description("Fetch one resource by slug")
    .action(async function(this: Command, slug: string) {
      try {
        const opts = this.optsWithGlobals<PublishCommandOptions>();

        // Normalize token option
        if (!opts.token && (opts as any).siteToken) {
          opts.token = (opts as any).siteToken;
        }

        const client = clientFactory.createPublishClient(opts);
        const resource = await client.resources.get(slug);

        renderList([resource] as MarvinResource[], resourceColumns, getOutputMode(opts));
      } catch (error) {
        console.error(error instanceof Error ? error.message : error);
        process.exitCode = 1;
      }
    });

  // Get entries that reference a resource
  parent
    .command("resource-entries <slug>")
    .description("Fetch entries that reference a resource")
    .action(async function(this: Command, slug: string) {
      try {
        const opts = this.optsWithGlobals<PublishCommandOptions>();

        // Normalize token option
        if (!opts.token && (opts as any).siteToken) {
          opts.token = (opts as any).siteToken;
        }

        const client = clientFactory.createPublishClient(opts);
        const entries = await client.resources.entries(slug);

        renderList(entries as MarvinEntry[], entryColumns, getOutputMode(opts));
      } catch (error) {
        console.error(error instanceof Error ? error.message : error);
        process.exitCode = 1;
      }
    });
}
