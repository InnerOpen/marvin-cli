import { Command } from "commander";
import { clientFactory } from "../../shared/clients.js";
import { renderList, renderData } from "../../output.js";
import { getOutputMode, type PlatformCommandOptions } from "../../shared/types.js";
import { handleCommandError } from "../../shared/error-handler.js";
import { say, emitDeleted } from "../../shared/io.js";
import { addDataOptions, readJsonInput } from "../../shared/json-input.js";
import { TABLE_SCHEMAS } from "../../shared/table-schemas.js";

export function registerEntryTypeCommands(parent: Command): void {
  const entryTypes = parent
    .command("entry-types")
    .description("Entry type operations");

  entryTypes
    .command("list")
    .description("List entry types")
    .action(async function(this: Command) {
      try {
        const opts = this.optsWithGlobals<PlatformCommandOptions>();
        const client = await clientFactory.createPlatformClient(opts);
        const entryTypes = await client.entryTypes.list();
        renderList(entryTypes as any[], TABLE_SCHEMAS['entry-types.list'], getOutputMode(opts));
      } catch (error) {
        handleCommandError(error);
      }
    });

  entryTypes
    .command("get <id>")
    .description("Get entry type by ID")
    .action(async function(this: Command, id: string) {
      try {
        const opts = this.optsWithGlobals<PlatformCommandOptions>();
        const client = await clientFactory.createPlatformClient(opts);
        const entryType = await client.entryTypes.get(id);
        renderData(entryType, getOutputMode(opts));
      } catch (error) {
        handleCommandError(error);
      }
    });

  // Create
  addDataOptions(entryTypes
    .command("create")
    .description("Create a new entry type"), "entry type data")
    .action(async function(this: Command, cmdOpts) {
      try {
        const data = await readJsonInput(cmdOpts);
        const opts = this.optsWithGlobals<PlatformCommandOptions>();
        const client = await clientFactory.createPlatformClient(opts);
        const entryType = await client.entryTypes.create(data);
        say(`✓ Created entry type: ${entryType.id}`);
        renderData(entryType, getOutputMode(opts));
      } catch (error) {
        handleCommandError(error);
      }
    });

  // Update
  addDataOptions(entryTypes
    .command("update <id>")
    .description("Update an entry type"), "entry type data")
    .action(async function(this: Command, id: string, cmdOpts) {
      try {
        const data = await readJsonInput(cmdOpts);
        const opts = this.optsWithGlobals<PlatformCommandOptions>();
        const client = await clientFactory.createPlatformClient(opts);
        const entryType = await client.entryTypes.update(id, data);
        say(`✓ Updated entry type: ${entryType.id}`);
        renderData(entryType, getOutputMode(opts));
      } catch (error) {
        handleCommandError(error);
      }
    });

  // Delete
  entryTypes
    .command("delete <id>")
    .description("Delete an entry type")
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
        await client.entryTypes.delete(id);
        emitDeleted(id, getOutputMode(opts), `✓ Deleted entry type: ${id}`);
      } catch (error) {
        handleCommandError(error);
      }
    });
}
