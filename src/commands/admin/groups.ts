import { Command } from "commander";
import { clientFactory } from "../../shared/clients.js";
import { getOutputMode } from '../../shared/types.js';
import { handleCommandError } from '../../shared/error-handler.js';
import type { PlatformCommandOptions } from "../../shared/types.js";
import { renderList, renderData } from "../../output.js";
import { readJsonInput } from "../../shared/json-input.js";

export function registerAdminGroupCommands(parent: Command): void {
  const groups = new Command("groups")
    .description("Workspace/group management (requires SUPER_ADMIN)");

  parent.addCommand(groups);

  // List groups
  groups
    .command("list")
    .description("List all workspaces/groups")
    .action(async function(this: Command) {
      try {
        const client = await clientFactory.createPlatformClient(parent.optsWithGlobals<PlatformCommandOptions>());
        const result = await client.workspaces.listAdminGroups();

        const globalOpts = parent.optsWithGlobals<PlatformCommandOptions>();
        renderList(result.items || [] as any, {
          id: 'id',
          name: 'name',
          slug: 'slug',
        } as any, getOutputMode(globalOpts));
      } catch (error) {
        handleCommandError(error);
        process.exitCode = 1;
      }
    });

  // Create group
  groups
    .command("create")
    .description("Create a new workspace/group")
    .option("--json <json>", "Group data as JSON string")
    .option("--file <path>", "Path to JSON file with group data (use '-' for stdin)")
    .action(async function(this: Command, cmdOpts) {
      try {
        const data = await readJsonInput(cmdOpts);

        const client = await clientFactory.createPlatformClient(parent.optsWithGlobals<PlatformCommandOptions>());
        const result = await client.workspaces.create(data);

        console.log(`✓ Created group: ${result.id}`);
        const globalOpts = parent.optsWithGlobals<PlatformCommandOptions>();
        renderData(result, getOutputMode(globalOpts));
      } catch (error) {
        handleCommandError(error);
        process.exitCode = 1;
      }
    });

  // Get group
  groups
    .command("get <id>")
    .description("Get a workspace/group by ID")
    .action(async function(this: Command, id: string) {
      try {
        const client = await clientFactory.createPlatformClient(parent.optsWithGlobals<PlatformCommandOptions>());
        const result = await client.workspaces.get(id);

        const globalOpts = parent.optsWithGlobals<PlatformCommandOptions>();
        renderData(result, getOutputMode(globalOpts));
      } catch (error) {
        handleCommandError(error);
        process.exitCode = 1;
      }
    });

  // Update group
  groups
    .command("update <id>")
    .description("Update a workspace/group")
    .option("--json <json>", "Group data as JSON string")
    .option("--file <path>", "Path to JSON file with group data (use '-' for stdin)")
    .action(async function(this: Command, id: string, cmdOpts) {
      try {
        const data = await readJsonInput(cmdOpts);

        const client = await clientFactory.createPlatformClient(parent.optsWithGlobals<PlatformCommandOptions>());
        const result = await client.workspaces.update(id, data);

        console.log(`✓ Updated group: ${result.id}`);
        const globalOpts = parent.optsWithGlobals<PlatformCommandOptions>();
        renderData(result, getOutputMode(globalOpts));
      } catch (error) {
        handleCommandError(error);
        process.exitCode = 1;
      }
    });

  // Delete group
  groups
    .command("delete <id>")
    .description("Delete a workspace/group")
    .option("--yes", "Skip confirmation prompt")
    .option("--force", "Force deletion even if the group has members/content")
    .action(async function(this: Command, id: string, cmdOpts) {
      try {
        if (!cmdOpts.yes) {
          console.error("Error: Delete requires --yes confirmation flag");
          process.exitCode = 1;
          return;
        }

        const client = await clientFactory.createPlatformClient(parent.optsWithGlobals<PlatformCommandOptions>());
        await client.workspaces.delete(id, cmdOpts.force === true);

        console.log(`✓ Deleted group: ${id}`);
      } catch (error) {
        handleCommandError(error);
        process.exitCode = 1;
      }
    });
}
