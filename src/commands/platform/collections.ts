import { handleCommandError } from '../../shared/error-handler.js';
import { Command } from "commander";
import { clientFactory } from "../../shared/clients.js";
import { renderList, renderData } from "../../output.js";
import { getOutputMode, type PlatformCommandOptions } from "../../shared/types.js";
import { TABLE_SCHEMAS } from "../../shared/table-schemas.js";
import { addDataOptions, readJsonInput } from "../../shared/json-input.js";
import { say, emitDeleted, emitOk } from "../../shared/io.js";

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
        renderList(collections as any[], TABLE_SCHEMAS['collections.list'], getOutputMode(opts));
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

  addDataOptions(collections
    .command("create")
    .description("Create a new collection"), "collection data")
    .action(async function(this: Command, cmdOpts) {
      try {
        const data = await readJsonInput(cmdOpts);

        const opts = this.optsWithGlobals<PlatformCommandOptions>();
        const client = await clientFactory.createPlatformClient(opts);
        const collection = await client.collections.create(data);
        say(`✓ Created collection: ${collection.id}`);
        renderData(collection, getOutputMode(opts));
      } catch (error) {
        handleCommandError(error);
        process.exitCode = 1;
      }
    });

  addDataOptions(collections
    .command("update <id>")
    .description("Update a collection"), "collection data")
    .action(async function(this: Command, id: string, cmdOpts) {
      try {
        const data = await readJsonInput(cmdOpts);

        const opts = this.optsWithGlobals<PlatformCommandOptions>();
        const client = await clientFactory.createPlatformClient(opts);
        const collection = await client.collections.update(id, data);
        say(`✓ Updated collection: ${collection.id}`);
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
        emitDeleted(id, getOutputMode(opts), `✓ Deleted collection: ${id}`);
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

        renderList(entries as any[], TABLE_SCHEMAS['collections.entries'], getOutputMode(opts));
      } catch (error) {
        handleCommandError(error);
        process.exitCode = 1;
      }
    });

  addDataOptions(collections
    .command("reorder <id>")
    .description("Reorder entries in a collection"), "an array of {entryId, sortOrder}")
    .action(async function(this: Command, id: string, cmdOpts) {
      try {
        const entries: Array<{ entryId: string; sortOrder: number }> = await readJsonInput(cmdOpts, { validateObject: false });

        if (!Array.isArray(entries) || entries.length === 0) {
          console.error("Error: Reorder data must be a non-empty array");
          process.exitCode = 1;
          return;
        }

        const opts = this.optsWithGlobals<PlatformCommandOptions>();
        const client = await clientFactory.createPlatformClient(opts);
        await client.collections.reorderEntries(id, entries);
        emitOk({ reordered: entries.length, collectionId: id }, getOutputMode(opts),
          `✓ Reordered ${entries.length} entries in collection ${id}`);
      } catch (error) {
        handleCommandError(error);
        process.exitCode = 1;
      }
    });

  collections
    .command("update-entry <id> <entry-id>")
    .description("Update junction fields (role, metadata) for an entry in a collection")
    .option("--role <role>", "Role for the entry within the collection")
    .option("--metadata <json>", "Junction metadata as JSON string")
    .option("--data <json|@file|->", "Full junction payload as JSON, @path, or - for stdin (overrides --role/--metadata)")
    .action(async function(this: Command, id: string, entryId: string, cmdOpts) {
      try {
        let data: any;
        if (cmdOpts.data !== undefined) {
          data = await readJsonInput(cmdOpts);
        } else {
          data = {};
          if (cmdOpts.role !== undefined) data.role = cmdOpts.role;
          if (cmdOpts.metadata) data.metadataJson = JSON.parse(cmdOpts.metadata);

          if (Object.keys(data).length === 0) {
            console.error("Error: Provide --role, --metadata, or --data");
            process.exitCode = 1;
            return;
          }
        }

        const opts = this.optsWithGlobals<PlatformCommandOptions>();
        const client = await clientFactory.createPlatformClient(opts);
        const result = await client.collections.updateEntryJunction(id, entryId, data);
        say(`✓ Updated entry ${entryId} in collection ${id}`);
        renderData(result, getOutputMode(opts));
      } catch (error) {
        handleCommandError(error);
        process.exitCode = 1;
      }
    });
}
