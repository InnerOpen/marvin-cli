import { Command } from "commander";
import { clientFactory } from "../../shared/clients.js";
import { renderList, renderData } from "../../output.js";
import { getOutputMode, type PlatformCommandOptions } from "../../shared/types.js";
import { TABLE_SCHEMAS } from "../../shared/table-schemas.js";
import { addDataOptions, readJsonInput } from "../../shared/json-input.js";
import { handleCommandError } from "../../shared/error-handler.js";
import { say, emitDeleted, emitOk } from "../../shared/io.js";

export function registerPlatformEntryCommands(parent: Command): void {
  const entries = parent
    .command("entries")
    .description("Entry CRUD operations");

  // List entries
  entries
    .command("list")
    .description("List entries")
    .action(async function(this: Command) {
      try {
        const opts = this.optsWithGlobals<PlatformCommandOptions>();
        const client = await clientFactory.createPlatformClient(opts);

        const entries = await client.entries.list();

        renderList(entries as any[], TABLE_SCHEMAS['entries.list'], getOutputMode(opts));
      } catch (error) {
        handleCommandError(error);
      }
    });

  // Get entry by ID
  entries
    .command("get <id>")
    .description("Get entry by ID")
    .action(async function(this: Command, id: string) {
      try {
        const opts = this.optsWithGlobals<PlatformCommandOptions>();
        const client = await clientFactory.createPlatformClient(opts);

        const entry = await client.entries.get(id);
        renderData(entry, getOutputMode(opts));
      } catch (error) {
        handleCommandError(error);
      }
    });

  // Create entry
  addDataOptions(entries
    .command("create")
    .description("Create a new entry"), "entry data")
    .action(async function(this: Command, cmdOpts) {
      try {
        const data = await readJsonInput(cmdOpts);

        const opts = this.optsWithGlobals<PlatformCommandOptions>();
        const client = await clientFactory.createPlatformClient(opts);

        const entry = await client.entries.create(data);
        say(`✓ Created entry: ${entry.id}`);
        renderData(entry, getOutputMode(opts));
      } catch (error) {
        handleCommandError(error);
      }
    });

  // Update entry
  addDataOptions(entries
    .command("update <id>")
    .description("Update an entry"), "entry data")
    .action(async function(this: Command, id: string, cmdOpts) {
      try {
        const data = await readJsonInput(cmdOpts);

        const opts = this.optsWithGlobals<PlatformCommandOptions>();
        const client = await clientFactory.createPlatformClient(opts);

        const entry = await client.entries.update(id, data);
        say(`✓ Updated entry: ${entry.id}`);
        renderData(entry, getOutputMode(opts));
      } catch (error) {
        handleCommandError(error);
      }
    });

  // Delete entry
  entries
    .command("delete <id>")
    .description("Delete an entry")
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

        await client.entries.delete(id);
        emitDeleted(id, getOutputMode(opts), `✓ Deleted entry: ${id}`);
      } catch (error) {
        handleCommandError(error);
      }
    });

  // List collections for an entry
  entries
    .command("collections <id>")
    .description("List collections that an entry belongs to")
    .action(async function(this: Command, id: string) {
      try {
        const opts = this.optsWithGlobals<PlatformCommandOptions>();
        const client = await clientFactory.createPlatformClient(opts);

        const collections = await client.entries.listCollections(id);
        renderList(collections as any[], TABLE_SCHEMAS['entries.collections'], getOutputMode(opts));
      } catch (error) {
        handleCommandError(error);
      }
    });

  // Add entry to collection
  entries
    .command("add-to-collection <entry-id> <collection-id>")
    .description("Add an entry to a collection")
    .action(async function(this: Command, entryId: string, collectionId: string) {
      try {
        const opts = this.optsWithGlobals<PlatformCommandOptions>();
        const client = await clientFactory.createPlatformClient(opts);

        const result = await client.entries.addToCollection(entryId, collectionId);
        emitOk({ ...result, entryId, collectionId }, getOutputMode(opts),
          `✓ ${result.message || `Added entry ${entryId} to collection ${collectionId}`}`);
      } catch (error) {
        handleCommandError(error);
      }
    });

  // Remove entry from collection
  entries
    .command("remove-from-collection <entry-id> <collection-id>")
    .description("Remove an entry from a collection")
    .action(async function(this: Command, entryId: string, collectionId: string) {
      try {
        const opts = this.optsWithGlobals<PlatformCommandOptions>();
        const client = await clientFactory.createPlatformClient(opts);

        await client.entries.removeFromCollection(entryId, collectionId);
        emitOk({ entryId, collectionId, removed: true }, getOutputMode(opts),
          `✓ Removed entry ${entryId} from collection ${collectionId}`);
      } catch (error) {
        handleCommandError(error);
      }
    });
}
