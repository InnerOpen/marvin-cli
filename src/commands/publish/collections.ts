import { Command } from "commander";
import { clientFactory } from "../../shared/clients.js";
import { renderList, renderData } from "../../output.js";
import { getOutputMode, type PublishCommandOptions } from "../../shared/types.js";
import { collectionColumns, entryColumns } from "../../shared/columns.js";
import { handleCommandError } from "../../shared/error-handler.js";
import type { MarvinCollection, MarvinEntry } from "@inneropen/marvin-sdk/types";

export function registerCollectionCommands(parent: Command): void {
  // List collections
  parent
    .command("collections")
    .description("List collections")
    .option("--limit <number>", "Limit", (v) => Number(v))
    .option("--offset <number>", "Offset", (v) => Number(v))
    .action(async function(this: Command) {
      try {
        const opts = this.optsWithGlobals<PublishCommandOptions>();

        // Normalize token option
        if (!opts.token && (opts as any).siteToken) {
          opts.token = (opts as any).siteToken;
        }

        const client = clientFactory.createPublishClient(opts);
        const collections = await client.collections.list();

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

        if (!collection) {
          console.error(`Collection not found: ${slug}`);
          process.exitCode = 1;
          return;
        }

        // Call toJSON() to get plain data object (Collection class has http client that shouldn't be serialized)
        const data = typeof collection.toJSON === 'function' ? collection.toJSON() : collection;
        renderData(data, getOutputMode(opts));
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

        renderList(entries as MarvinEntry[], collectionEntryColumns, getOutputMode(opts));
      } catch (error) {
        handleCommandError(error);
      }
    });
}
