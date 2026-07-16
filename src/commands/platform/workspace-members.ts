import { handleCommandError } from '../../shared/error-handler.js';
import { Command } from "commander";
import { clientFactory } from "../../shared/clients.js";
import { renderList, renderData } from "../../output.js";
import { getOutputMode, type PlatformCommandOptions } from "../../shared/types.js";
import { readFileSync } from "fs";

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

        renderList(members, {
          "User ID": (m: any) => m.userId || "",
          "Username": (m: any) => m.user?.username || "",
          "Email": (m: any) => m.user?.email || "",
          "Role": (m: any) => m.workspaceRole || "",
          "Joined": (m: any) => m.joinedAt ? new Date(m.joinedAt).toISOString().split('T')[0] : "",
        }, getOutputMode(opts));
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
  members
    .command("add <workspace-id>")
    .description("Add a user to a workspace with a specific role")
    .option("--json <json>", "Member data as JSON string")
    .option("--file <path>", "Path to JSON file with member data")
    .option("--user-id <id>", "User ID to add")
    .option("--role <role>", "Workspace role: OWNER, ADMIN, MEMBER, or VIEWER")
    .action(async function(this: Command, workspaceId: string, cmdOpts) {
      try {
        let data: any;

        if (cmdOpts.json) {
          data = JSON.parse(cmdOpts.json);
        } else if (cmdOpts.file) {
          data = JSON.parse(readFileSync(cmdOpts.file, "utf-8"));
        } else if (cmdOpts.userId && cmdOpts.role) {
          // Allow quick add via flags
          data = {
            user_id: cmdOpts.userId,
            workspace_role: cmdOpts.role.toUpperCase(),
          };
        } else {
          console.error("Error: Provide member data via --json, --file, or --user-id and --role");
          process.exitCode = 1;
          return;
        }

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

        console.log(`✓ Added user to workspace with role: ${member.workspaceRole}`);
        renderData(member, getOutputMode(opts));
      } catch (error) {
        handleCommandError(error);
        process.exitCode = 1;
      }
    });

  // Update member role
  members
    .command("update-role <workspace-id> <user-id>")
    .description("Update a workspace member's role")
    .option("--json <json>", "Member data as JSON string")
    .option("--file <path>", "Path to JSON file with member data")
    .option("--role <role>", "New workspace role: OWNER, ADMIN, MEMBER, or VIEWER")
    .action(async function(this: Command, workspaceId: string, userId: string, cmdOpts) {
      try {
        let data: any;

        if (cmdOpts.json) {
          data = JSON.parse(cmdOpts.json);
        } else if (cmdOpts.file) {
          data = JSON.parse(readFileSync(cmdOpts.file, "utf-8"));
        } else if (cmdOpts.role) {
          // Allow quick update via flag
          data = {
            workspace_role: cmdOpts.role.toUpperCase(),
          };
        } else {
          console.error("Error: Provide member data via --json, --file, or --role");
          process.exitCode = 1;
          return;
        }

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

        console.log(`✓ Updated member role to: ${member.workspaceRole}`);
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

        console.log(`✓ Removed user from workspace`);
      } catch (error) {
        handleCommandError(error);
        process.exitCode = 1;
      }
    });
}
