import { Command } from "commander";
import { MarvinNotFoundError } from "@inneropen/marvin-sdk";
import { clientFactory } from "../../shared/clients.js";
import { renderList } from "../../output.js";
import { getOutputMode, type PublishCommandOptions } from "../../shared/types.js";
import { resourceColumns } from "../../shared/columns.js";
import { handleCommandError } from "../../shared/error-handler.js";

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
        handleCommandError(error);
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
        try {
          const resource = await client.resources.get(slug);
          // resources.get() returns a rich Resource wrapper; toJSON() yields the plain
          // MarvinResource the table columns expect (list() already returns plain objects).
          renderList(resource ? [resource.toJSON()] : [], resourceColumns, getOutputMode(opts));
        } catch (error) {
          if (error instanceof MarvinNotFoundError) {
            renderList([], resourceColumns, getOutputMode(opts));
            process.exitCode = 1;
          } else {
            throw error;
          }
        }
      } catch (error) {
        handleCommandError(error);
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
        try {
          const slugs = await client.resources.entries(slug);
          const slugColumns = { Slug: (s: string) => s };
          renderList(slugs, slugColumns, getOutputMode(opts));
        } catch (error) {
          if (error instanceof MarvinNotFoundError) {
            renderList([], { Slug: (s: string) => s }, getOutputMode(opts));
            process.exitCode = 1;
          } else {
            throw error;
          }
        }
      } catch (error) {
        handleCommandError(error);
      }
    });
}
