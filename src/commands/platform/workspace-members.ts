import { handleCommandError } from '../../shared/error-handler.js';
import { say, emitDeleted } from "../../shared/io.js";
import { addDataOptions, readJsonInput } from "../../shared/json-input.js";
import { Command } from "commander";
import { clientFactory } from "../../shared/clients.js";
import { renderList, renderData } from "../../output.js";
import { getOutputMode, type PlatformCommandOptions } from "../../shared/types.js";
import { TABLE_SCHEMAS } from "../../shared/table-schemas.js";
import { WORKSPACE_ROLES } from "../../shared/permissions.js";

const ROLE_LIST = WORKSPACE_ROLES.join(", ");

/**
 * Body for the SDK (camelCase, as the API documents it). --data/--file bodies may still use the
 * snake_case keys earlier releases documented; the role is upper-cased and checked against the
 * backend's WorkspaceRole enum. Returns undefined (after printing why) for an unknown role.
 */
function memberBody(raw: any): { userId?: string; workspaceRole?: string } | undefined {
  const { user_id, workspace_role, ...rest } = raw ?? {};
  const body: any = { ...rest };
  if (user_id !== undefined && body.userId === undefined) body.userId = user_id;
  const role = body.workspaceRole ?? workspace_role;
  if (role !== undefined) {
    const upper = String(role).toUpperCase();
    if (!(WORKSPACE_ROLES as readonly string[]).includes(upper)) {
      console.error(`Error: Invalid role. Must be one of: ${ROLE_LIST}`);
      process.exitCode = 1;
      return undefined;
    }
    body.workspaceRole = upper;
  }
  return body;
}

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
    .option("--role <role>", `Workspace role: ${ROLE_LIST}`)
    .action(async function(this: Command, workspaceId: string, cmdOpts) {
      try {
        // Quick add via flags; otherwise a full body from --data/--file/stdin
        const data = memberBody(cmdOpts.userId && cmdOpts.role && cmdOpts.data === undefined && !cmdOpts.file
          ? { userId: cmdOpts.userId, workspaceRole: cmdOpts.role }
          : await readJsonInput(cmdOpts));
        if (!data) return;

        const opts = this.optsWithGlobals<PlatformCommandOptions>();
        const client = await clientFactory.createPlatformClient(opts);
        const member = await client.workspaceMembers.add(workspaceId, data as any);

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
    .option("--role <role>", `New workspace role: ${ROLE_LIST}`)
    .action(async function(this: Command, workspaceId: string, userId: string, cmdOpts) {
      try {
        // Quick update via --role; otherwise a full body from --data/--file/stdin
        const data = memberBody(cmdOpts.role && cmdOpts.data === undefined && !cmdOpts.file
          ? { workspaceRole: cmdOpts.role }
          : await readJsonInput(cmdOpts));
        if (!data) return;

        const opts = this.optsWithGlobals<PlatformCommandOptions>();
        const client = await clientFactory.createPlatformClient(opts);
        const member = await client.workspaceMembers.updateRole(workspaceId, userId, data as any);

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
