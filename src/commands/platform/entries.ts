import { Command } from "commander";
import { clientFactory } from "../../shared/clients.js";
import { renderList, renderData } from "../../output.js";
import { getOutputMode, type PlatformCommandOptions } from "../../shared/types.js";
import { platformEntryColumns } from "../../shared/columns.js";
import { readJsonInput } from "../../shared/json-input.js";
import { handleCommandError } from "../../shared/error-handler.js";

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

        renderList(entries as any[], platformEntryColumns, getOutputMode(opts));
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
  entries
    .command("create")
    .description("Create a new entry")
    .option("--json <json>", "Entry data as JSON string")
    .option("--file <path>", "Path to JSON file with entry data (use '-' for stdin)")
    .action(async function(this: Command, cmdOpts) {
      try {
        const data = await readJsonInput(cmdOpts);

        const opts = this.optsWithGlobals<PlatformCommandOptions>();
        const client = await clientFactory.createPlatformClient(opts);

        const entry = await client.entries.create(data);
        console.log(`✓ Created entry: ${entry.id}`);
        renderData(entry, getOutputMode(opts));
      } catch (error) {
        handleCommandError(error);
      }
    });

  // Update entry
  entries
    .command("update <id>")
    .description("Update an entry")
    .option("--json <json>", "Entry data as JSON string")
    .option("--file <path>", "Path to JSON file with entry data (use '-' for stdin)")
    .action(async function(this: Command, id: string, cmdOpts) {
      try {
        const data = await readJsonInput(cmdOpts);

        const opts = this.optsWithGlobals<PlatformCommandOptions>();
        const client = await clientFactory.createPlatformClient(opts);

        const entry = await client.entries.update(id, data);
        console.log(`✓ Updated entry: ${entry.id}`);
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
        console.log(`✓ Deleted entry: ${id}`);
      } catch (error) {
        handleCommandError(error);
      }
    });
}
