import { Command } from "commander";
import { clientFactory } from "../../shared/clients.js";
import { getOutputMode } from '../../shared/types.js';
import { handleCommandError } from '../../shared/error-handler.js';
import type { PlatformCommandOptions } from "../../shared/types.js";
import { renderList, renderData } from "../../output.js";
import { addDataOptions, readJsonInput } from "../../shared/json-input.js";
import { say, emitDeleted } from "../../shared/io.js";

export function registerAdminWorkspaceMemberCommands(parent: Command): void {
  const members = new Command("workspace-members")
    .description("Workspace membership management (requires SUPER_ADMIN)");

  parent.addCommand(members);

  // List members
  members
    .command("list <workspace-id>")
    .description("List all members of a workspace")
    .action(async function(this: Command, workspaceId: string) {
      try {
        const client = await clientFactory.createPlatformClient(parent.optsWithGlobals<PlatformCommandOptions>());
        const result = await client.adminWorkspaces.listMembers(workspaceId);

        const globalOpts = parent.optsWithGlobals<PlatformCommandOptions>();
        renderList(result as any[], {
          id: 'id',
          userId: 'userId',
          groupId: 'groupId',
          workspaceRole: 'workspaceRole',
        } as any, getOutputMode(globalOpts));
      } catch (error) {
        handleCommandError(error);
        process.exitCode = 1;
      }
    });

  // Get member
  members
    .command("get <workspace-id> <user-id>")
    .description("Get a specific member of a workspace")
    .action(async function(this: Command, workspaceId: string, userId: string) {
      try {
        const client = await clientFactory.createPlatformClient(parent.optsWithGlobals<PlatformCommandOptions>());
        const result = await client.adminWorkspaces.getMember(workspaceId, userId);

        const globalOpts = parent.optsWithGlobals<PlatformCommandOptions>();
        renderData(result, getOutputMode(globalOpts));
      } catch (error) {
        handleCommandError(error);
        process.exitCode = 1;
      }
    });

  // Add member
  addDataOptions(members
    .command("add <workspace-id>")
    .description("Add a member to a workspace"), "member data")
    .action(async function(this: Command, workspaceId: string, cmdOpts) {
      try {
        const data = await readJsonInput(cmdOpts);

        const client = await clientFactory.createPlatformClient(parent.optsWithGlobals<PlatformCommandOptions>());
        const result = await client.adminWorkspaces.addMember(workspaceId, data);

        say(`✓ Added member to workspace ${workspaceId}`);
        const globalOpts = parent.optsWithGlobals<PlatformCommandOptions>();
        renderData(result, getOutputMode(globalOpts));
      } catch (error) {
        handleCommandError(error);
        process.exitCode = 1;
      }
    });

  // Update member role
  addDataOptions(members
    .command("update-role <workspace-id> <user-id>")
    .description("Update a workspace member's role"), "member data")
    .action(async function(this: Command, workspaceId: string, userId: string, cmdOpts) {
      try {
        const data = await readJsonInput(cmdOpts);

        const client = await clientFactory.createPlatformClient(parent.optsWithGlobals<PlatformCommandOptions>());
        const result = await client.adminWorkspaces.updateMember(workspaceId, userId, data);

        say(`✓ Updated member ${userId} in workspace ${workspaceId}`);
        const globalOpts = parent.optsWithGlobals<PlatformCommandOptions>();
        renderData(result, getOutputMode(globalOpts));
      } catch (error) {
        handleCommandError(error);
        process.exitCode = 1;
      }
    });

  // Remove member
  members
    .command("remove <workspace-id> <user-id>")
    .description("Remove a member from a workspace")
    .option("--yes", "Skip confirmation prompt")
    .action(async function(this: Command, workspaceId: string, userId: string, cmdOpts) {
      try {
        if (!cmdOpts.yes) {
          console.error("Error: Remove requires --yes confirmation flag");
          process.exitCode = 1;
          return;
        }

        const client = await clientFactory.createPlatformClient(parent.optsWithGlobals<PlatformCommandOptions>());
        await client.adminWorkspaces.removeMember(workspaceId, userId);

        emitDeleted(userId, getOutputMode(parent.optsWithGlobals<PlatformCommandOptions>()), `✓ Removed member ${userId} from workspace ${workspaceId}`);
      } catch (error) {
        handleCommandError(error);
        process.exitCode = 1;
      }
    });
}
