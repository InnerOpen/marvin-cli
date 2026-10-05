import { handleCommandError } from '../../shared/error-handler.js';
import { say, emitDeleted } from "../../shared/io.js";
import { addDataOptions, readJsonInput } from "../../shared/json-input.js";
import { Command } from "commander";
import { clientFactory } from "../../shared/clients.js";
import { renderList, renderData } from "../../output.js";
import { getOutputMode, type PlatformCommandOptions } from "../../shared/types.js";
import { TABLE_SCHEMAS } from "../../shared/table-schemas.js";

export function registerWorkspaceMemberCommands(parent: Command): void {
  const members = parent
    .command("workspace-members")
    .description("Workspace member management (requires workspace admin role)");

  // List workspace members
  members
    .command("list <workspace-id>")
    .description("List all members of a workspace")
    .action(async function(this: Command, workspaceId: string) {
      try {
        const opts = this.optsWithGlobals<PlatformCommandOptions>();
        const client = await clientFactory.createPlatformClient(opts);
        const members = await client.workspaceMembers.list(workspaceId);

        renderList(members as any[], TABLE_SCHEMAS['workspace-members.list'], getOutputMode(opts));
      } catch (error) {
        handleCommandError(error);
        process.exitCode = 1;
      }
    });

  // Get specific workspace member
  members
    .command("get <workspace-id> <user-id>")
    .description("Get details of a specific workspace member")
    .action(async function(this: Command, workspaceId: string, userId: string) {
      try {
        const opts = this.optsWithGlobals<PlatformCommandOptions>();
        const client = await clientFactory.createPlatformClient(opts);
        const member = await client.workspaceMembers.get(workspaceId, userId);

        renderData(member, getOutputMode(opts));
      } catch (error) {
        handleCommandError(error);
        process.exitCode = 1;
      }
    });

  // Add workspace member
  addDataOptions(members
    .command("add <workspace-id>")
    .description("Add a user to a workspace with a specific role"), "member data")
    .option("--user-id <id>", "User ID to add")
    .option("--role <role>", "Workspace role: OWNER, ADMIN, MEMBER, or VIEWER")
    .action(async function(this: Command, workspaceId: string, cmdOpts) {
      try {
        // Quick add via flags; otherwise a full body from --data/--file/stdin
        const data: any = cmdOpts.userId && cmdOpts.role && cmdOpts.data === undefined && !cmdOpts.file
          ? { user_id: cmdOpts.userId, workspace_role: cmdOpts.role.toUpperCase() }
          : await readJsonInput(cmdOpts);

        // Validate role
        const validRoles = ['OWNER', 'ADMIN', 'MEMBER', 'VIEWER'];
        if (data.workspace_role && !validRoles.includes(data.workspace_role)) {
          console.error(`Error: Invalid role. Must be one of: ${validRoles.join(', ')}`);
          process.exitCode = 1;
          return;
        }

        const opts = this.optsWithGlobals<PlatformCommandOptions>();
        const client = await clientFactory.createPlatformClient(opts);
        const member = await client.workspaceMembers.add(workspaceId, data);

        say(`✓ Added user to workspace with role: ${member.workspaceRole}`);
        renderData(member, getOutputMode(opts));
      } catch (error) {
        handleCommandError(error);
        process.exitCode = 1;
      }
    });

  // Update member role
  addDataOptions(members
    .command("update-role <workspace-id> <user-id>")
    .description("Update a workspace member's role"), "member data")
    .option("--role <role>", "New workspace role: OWNER, ADMIN, MEMBER, or VIEWER")
    .action(async function(this: Command, workspaceId: string, userId: string, cmdOpts) {
      try {
        // Quick update via --role; otherwise a full body from --data/--file/stdin
        const data: any = cmdOpts.role && cmdOpts.data === undefined && !cmdOpts.file
          ? { workspace_role: cmdOpts.role.toUpperCase() }
          : await readJsonInput(cmdOpts);

        // Validate role
        const validRoles = ['OWNER', 'ADMIN', 'MEMBER', 'VIEWER'];
        if (data.workspace_role && !validRoles.includes(data.workspace_role)) {
          console.error(`Error: Invalid role. Must be one of: ${validRoles.join(', ')}`);
          process.exitCode = 1;
          return;
        }

        const opts = this.optsWithGlobals<PlatformCommandOptions>();
        const client = await clientFactory.createPlatformClient(opts);
        const member = await client.workspaceMembers.updateRole(workspaceId, userId, data);

        say(`✓ Updated member role to: ${member.workspaceRole}`);
        renderData(member, getOutputMode(opts));
      } catch (error) {
        handleCommandError(error);
        process.exitCode = 1;
      }
    });

  // Remove workspace member
  members
    .command("remove <workspace-id> <user-id>")
    .description("Remove a user from a workspace")
    .option("--yes", "Skip confirmation prompt")
    .action(async function(this: Command, workspaceId: string, userId: string, cmdOpts) {
      try {
        if (!cmdOpts.yes) {
          console.error("Error: Remove requires --yes confirmation flag");
          process.exitCode = 1;
          return;
        }

        const opts = this.optsWithGlobals<PlatformCommandOptions>();
        const client = await clientFactory.createPlatformClient(opts);
        await client.workspaceMembers.remove(workspaceId, userId);

        emitDeleted(userId, getOutputMode(opts), `✓ Removed user ${userId} from workspace`);
      } catch (error) {
        handleCommandError(error);
        process.exitCode = 1;
      }
    });
}
