import { Command } from "commander";
import { clientFactory } from "../../shared/clients.js";
import { renderList, renderData } from "../../output.js";
import { getOutputMode, type PlatformCommandOptions } from "../../shared/types.js";
import { handleCommandError } from "../../shared/error-handler.js";
import { readJsonInput } from "../../shared/json-input.js";

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
        renderList(entryTypes, {
          ID: "id",
          Name: "name",
          Slug: "slug",
          System: "isSystem",
          Renderer: (et: any) => et.renderingJson?.renderer || "",
          Package: (et: any) => et.renderingJson?.package || "",
          Publishable: (et: any) => et.capabilitiesJson ? (et.capabilitiesJson.publishable !== false ? "yes" : "no") : "",
          Routable: (et: any) => et.capabilitiesJson ? (et.capabilitiesJson.routable !== false ? "yes" : "no") : "",
        }, getOutputMode(opts));
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
  entryTypes
    .command("create")
    .description("Create a new entry type")
    .option("--json <json>", "Entry type data as JSON string")
    .option("--file <path>", "Path to JSON file with entry type data (use '-' for stdin)")
    .action(async function(this: Command, cmdOpts) {
      try {
        const data = await readJsonInput(cmdOpts);
        const opts = this.optsWithGlobals<PlatformCommandOptions>();
        const client = await clientFactory.createPlatformClient(opts);
        const entryType = await client.entryTypes.create(data);
        console.log(`✓ Created entry type: ${entryType.id}`);
        renderData(entryType, getOutputMode(opts));
      } catch (error) {
        handleCommandError(error);
      }
    });

  // Update
  entryTypes
    .command("update <id>")
    .description("Update an entry type")
    .option("--json <json>", "Entry type data as JSON string")
    .option("--file <path>", "Path to JSON file with entry type data (use '-' for stdin)")
    .action(async function(this: Command, id: string, cmdOpts) {
      try {
        const data = await readJsonInput(cmdOpts);
        const opts = this.optsWithGlobals<PlatformCommandOptions>();
        const client = await clientFactory.createPlatformClient(opts);
        const entryType = await client.entryTypes.update(id, data);
        console.log(`✓ Updated entry type: ${entryType.id}`);
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
        console.log(`✓ Deleted entry type: ${id}`);
      } catch (error) {
        handleCommandError(error);
      }
    });
}
