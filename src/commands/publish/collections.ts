import { Command } from "commander";
import { clientFactory } from "../../shared/clients.js";
import { renderList, renderJson, renderYaml } from "../../output.js";
import { getOutputMode, type PublishCommandOptions } from "../../shared/types.js";
import { collectionColumns, entryColumns } from "../../shared/columns.js";
import { handleCommandError } from "../../shared/error-handler.js";
import { validatePositiveInteger, validateNonNegativeInteger } from "../../shared/validation.js";

export function registerCollectionCommands(parent: Command): void {
  // List collections
  parent
    .command("collections")
    .description("List collections")
    .option("--limit <number>", "Show at most this many collections")
    .option("--offset <number>", "Skip this many collections first")
    .action(async function(this: Command, cmdOpts) {
      try {
        const opts = this.optsWithGlobals<PublishCommandOptions>();
        const limit = cmdOpts.limit === undefined ? undefined : validatePositiveInteger(cmdOpts.limit, "--limit");
        const offset = cmdOpts.offset === undefined ? 0 : validateNonNegativeInteger(cmdOpts.offset, "--offset");

        // Normalize token option
        if (!opts.token && (opts as any).siteToken) {
          opts.token = (opts as any).siteToken;
        }

        const client = clientFactory.createPublishClient(opts);
        // The SDK's collections.list() takes no paging, so slice here
        const all = await client.collections.list();
        const collections = limit === undefined ? all.slice(offset) : all.slice(offset, offset + limit);

        renderList(collections, collectionColumns, getOutputMode(opts));
      } catch (error) {
        handleCommandError(error);
      }
    });

  // Get single collection
  parent
    .command("collection <slug>")
    .description("Fetch one collection by slug")
    .action(async function(this: Command, slug: string) {
      try {
        const opts = this.optsWithGlobals<PublishCommandOptions>();

        // Normalize token option
        if (!opts.token && (opts as any).siteToken) {
          opts.token = (opts as any).siteToken;
        }

        const client = clientFactory.createPublishClient(opts);
        const collection = await client.collections.get(slug);

        if (!collection || Array.isArray(collection)) {
          const mode = getOutputMode(opts);
          if (mode === "json" || mode === "yaml") {
            process.stdout.write("[]\n");
          } else {
            console.error(`Collection not found: ${slug}`);
          }
          process.exitCode = 1;
          return;
        }

        const raw = collection.toJSON();
        const data = {
          slug: raw.slug,
          name: raw.name,
          description: raw.description,
          metadataJson: raw.metadataJson,
          isSmart: raw.isSmart,
          smartRules: raw.smartRules,
          entryCount: raw.entryCount,
          entries: collection.entries,
        };
        const mode = getOutputMode(opts);
        if (mode === "json") renderJson(data);
        else if (mode === "yaml") renderYaml(data);
        else renderList([data], collectionColumns, mode);
      } catch (error) {
        handleCommandError(error);
      }
    });

  // Get entries in a collection
  parent
    .command("collection-entries <slug>")
    .description("Fetch entries in a collection (ordered)")
    .action(async function(this: Command, slug: string) {
      try {
        const opts = this.optsWithGlobals<PublishCommandOptions>();

        // Normalize token option
        if (!opts.token && (opts as any).siteToken) {
          opts.token = (opts as any).siteToken;
        }

        const client = clientFactory.createPublishClient(opts);
        const entries = await client.collections.entries(slug);

        // Custom columns to include order
        const collectionEntryColumns = {
          Order: (entry: any) => entry.order !== undefined && entry.order !== null ? String(entry.order) : "-",
          ...entryColumns,
        };

        renderList(entries, collectionEntryColumns, getOutputMode(opts));
      } catch (error) {
        handleCommandError(error);
      }
    });
}
