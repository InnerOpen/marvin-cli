import { Command } from "commander";
import { clientFactory } from "../../shared/clients.js";
import { renderList, renderData } from "../../output.js";
import { getOutputMode, type PublishCommandOptions } from "../../shared/types.js";
import { collectionColumns, entryColumns } from "../../shared/columns.js";
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
        console.error(error instanceof Error ? error.message : error);
        process.exitCode = 1;
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

        // Collection object has toJSON() method, use it for display
        renderData(collection, getOutputMode(opts));
      } catch (error) {
        console.error(error instanceof Error ? error.message : error);
        process.exitCode = 1;
      }
    });

  // Get entries in a collection
  parent
    .command("collection-entries <slug>")
    .description("Fetch entries in a collection")
    .action(async function(this: Command, slug: string) {
      try {
        const opts = this.optsWithGlobals<PublishCommandOptions>();

        // Normalize token option
        if (!opts.token && (opts as any).siteToken) {
          opts.token = (opts as any).siteToken;
        }

        const client = clientFactory.createPublishClient(opts);
        const entries = await client.collections.entries(slug);

        renderList(entries as MarvinEntry[], entryColumns, getOutputMode(opts));
      } catch (error) {
        console.error(error instanceof Error ? error.message : error);
        process.exitCode = 1;
      }
    });
}
