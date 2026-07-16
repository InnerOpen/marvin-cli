import { handleCommandError } from '../../shared/error-handler.js';
import { Command } from "commander";
import { readFileSync } from "fs";
import { clientFactory } from "../../shared/clients.js";
import { renderList, renderData } from "../../output.js";
import { getOutputMode, type PlatformCommandOptions } from "../../shared/types.js";
import { platformCollectionColumns } from "../../shared/columns.js";
import { readJsonInput } from "../../shared/json-input.js";

export function registerPlatformCollectionCommands(parent: Command): void {
  const collections = parent
    .command("collections")
    .description("Collection CRUD operations");

  collections
    .command("list")
    .description("List collections")
    .action(async function(this: Command) {
      try {
        const opts = this.optsWithGlobals<PlatformCommandOptions>();
        const client = await clientFactory.createPlatformClient(opts);
        const collections = await client.collections.list();
        renderList(collections as any[], platformCollectionColumns, getOutputMode(opts));
      } catch (error) {
        handleCommandError(error);
        process.exitCode = 1;
      }
    });

  collections
    .command("get <id>")
    .description("Get collection by ID")
    .action(async function(this: Command, id: string) {
      try {
        const opts = this.optsWithGlobals<PlatformCommandOptions>();
        const client = await clientFactory.createPlatformClient(opts);
        const collection = await client.collections.get(id);
        renderData(collection, getOutputMode(opts));
      } catch (error) {
        handleCommandError(error);
        process.exitCode = 1;
      }
    });

  collections
    .command("create")
    .description("Create a new collection")
    .option("--json <json>", "Collection data as JSON string")
    .option("--file <path>", "Path to JSON file with collection data (use '-' for stdin)")
    .action(async function(this: Command, cmdOpts) {
      try {
        let data: any;
        if (cmdOpts.json) {
          data = JSON.parse(cmdOpts.json);
        } else if (cmdOpts.file) {
          data = JSON.parse(readFileSync(cmdOpts.file, "utf-8"));
        } else {
          console.error("Error: Provide collection data via --json or --file");
          process.exitCode = 1;
          return;
        }

        const opts = this.optsWithGlobals<PlatformCommandOptions>();
        const client = await clientFactory.createPlatformClient(opts);
        const collection = await client.collections.create(data);
        console.log(`✓ Created collection: ${collection.id}`);
        renderData(collection, getOutputMode(opts));
      } catch (error) {
        handleCommandError(error);
        process.exitCode = 1;
      }
    });

  collections
    .command("update <id>")
    .description("Update a collection")
    .option("--json <json>", "Collection data as JSON string")
    .option("--file <path>", "Path to JSON file with collection data (use '-' for stdin)")
    .action(async function(this: Command, id: string, cmdOpts) {
      try {
        let data: any;
        if (cmdOpts.json) {
          data = JSON.parse(cmdOpts.json);
        } else if (cmdOpts.file) {
          data = JSON.parse(readFileSync(cmdOpts.file, "utf-8"));
        } else {
          console.error("Error: Provide collection data via --json or --file");
          process.exitCode = 1;
          return;
        }

        const opts = this.optsWithGlobals<PlatformCommandOptions>();
        const client = await clientFactory.createPlatformClient(opts);
        const collection = await client.collections.update(id, data);
        console.log(`✓ Updated collection: ${collection.id}`);
        renderData(collection, getOutputMode(opts));
      } catch (error) {
        handleCommandError(error);
        process.exitCode = 1;
      }
    });

  collections
    .command("delete <id>")
    .description("Delete a collection")
    .option("--yes", "Skip confirmation prompt")
    .action(async function(this: Command, id: string, cmdOpts) {
      try {
        if (!cmdOpts.yes) {
          console.error("Error: Delete requires --yes confirmation flag");
          process.exitCode = 1;
          return;
        }

        const opts = this.optsWithGlobals<PlatformCommandOptions>();
        const client = await clientFactory.createPlatformClient(opts);
        await client.collections.delete(id);
        console.log(`✓ Deleted collection: ${id}`);
      } catch (error) {
        handleCommandError(error);
        process.exitCode = 1;
      }
    });

  collections
    .command("entries <id>")
    .description("List entries in a collection (ordered)")
    .action(async function(this: Command, id: string) {
      try {
        const opts = this.optsWithGlobals<PlatformCommandOptions>();
        const client = await clientFactory.createPlatformClient(opts);
        const entries = await client.collections.getEntries(id);

        // Show entries with order column
        const entriesColumns = {
          Order: (e: any) => e.order !== undefined && e.order !== null ? String(e.order) : '-',
          ID: (e: any) => e.id,
          Title: (e: any) => e.title,
          Status: (e: any) => e.status || '-',
          Published: (e: any) => e.publishedAt || '-',
        };

        renderList(entries as any[], entriesColumns, getOutputMode(opts));
      } catch (error) {
        handleCommandError(error);
        process.exitCode = 1;
      }
    });

  collections
    .command("reorder <id>")
    .description("Reorder entries in a collection")
    .option("--json <json>", "Array of {entryId, sortOrder} as JSON string")
    .option("--file <path>", "Path to JSON file with reorder data")
    .action(async function(this: Command, id: string, cmdOpts) {
      try {
        let entries: Array<{ entryId: string; sortOrder: number }>;

        if (cmdOpts.json) {
          entries = JSON.parse(cmdOpts.json);
        } else if (cmdOpts.file) {
          entries = JSON.parse(readFileSync(cmdOpts.file, "utf-8"));
        } else {
          console.error("Error: Provide reorder data via --json or --file");
          console.error('Example: --json \'[{"entryId":"abc","sortOrder":0},{"entryId":"def","sortOrder":1}]\'');
          process.exitCode = 1;
          return;
        }

        if (!Array.isArray(entries) || entries.length === 0) {
          console.error("Error: Reorder data must be a non-empty array");
          process.exitCode = 1;
          return;
        }

        const opts = this.optsWithGlobals<PlatformCommandOptions>();
        const client = await clientFactory.createPlatformClient(opts);
        await client.collections.reorderEntries(id, entries);
        console.log(`✓ Reordered ${entries.length} entries in collection ${id}`);
      } catch (error) {
        handleCommandError(error);
        process.exitCode = 1;
      }
    });
}
