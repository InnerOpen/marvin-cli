import { Command } from "commander";
import { clientFactory } from "../../shared/clients.js";
import { getOutputMode } from '../../shared/types.js';
import { handleCommandError } from '../../shared/error-handler.js';
import type { PlatformCommandOptions } from "../../shared/types.js";
import { renderList, renderData } from "../../output.js";
import { readJsonInput } from "../../shared/json-input.js";
import { formatTokenForOutput, displayTokenWarning } from "../../shared/security.js";

export function registerAdminUsersCommands(parent: Command): void {
  const users = new Command("users")
    .description("User management (requires SUPER_ADMIN)");

  parent.addCommand(users);

  // List users
  users
    .command("list")
    .description("List all users")
    .option("--page <number>", "Page number", "1")
    .option("--per-page <number>", "Items per page", "50")
    .action(async function(this: Command, cmdOpts) {
      try {
        const client = await clientFactory.createPlatformClient(parent.optsWithGlobals<PlatformCommandOptions>());
        const page = parseInt(cmdOpts.page, 10);
        const perPage = parseInt(cmdOpts.perPage, 10);

        const result = await client.adminUsers.list(page, perPage);

        const globalOpts = parent.optsWithGlobals<PlatformCommandOptions>();
        renderList(result.items || [] as any, {
          id: 'id',
          username: 'username',
          fullName: 'fullName',
          email: 'email',
          platformRole: 'platformRole',
        } as any, getOutputMode(globalOpts));
      } catch (error) {
        handleCommandError(error);
        process.exitCode = 1;
      }
    });

  // Get user
  users
    .command("get <id>")
    .description("Get user by ID")
    .action(async function(this: Command, id: string) {
      try {
        const client = await clientFactory.createPlatformClient(parent.optsWithGlobals<PlatformCommandOptions>());
        const user = await client.adminUsers.get(id);

        const globalOpts = parent.optsWithGlobals<PlatformCommandOptions>();
        renderData(user, getOutputMode(globalOpts));
      } catch (error) {
        handleCommandError(error);
        process.exitCode = 1;
      }
    });

  // Create user
  users
    .command("create")
    .description("Create a new user")
    .option("--json <json>", "User data as JSON string")
    .option("--file <path>", "Path to JSON file with user data (use '-' for stdin)")
    .action(async function(this: Command, cmdOpts) {
      try {
        const data = await readJsonInput(cmdOpts);

        const client = await clientFactory.createPlatformClient(parent.optsWithGlobals<PlatformCommandOptions>());
        const user = await client.adminUsers.create(data);

        console.log(`✓ Created user: ${user.id}`);
        const globalOpts = parent.optsWithGlobals<PlatformCommandOptions>();
        renderData(user, getOutputMode(globalOpts));
      } catch (error) {
        handleCommandError(error);
        process.exitCode = 1;
      }
    });

  // Update user
  users
    .command("update <id>")
    .description("Update a user")
    .option("--json <json>", "User data as JSON string")
    .option("--file <path>", "Path to JSON file with user data (use '-' for stdin)")
    .action(async function(this: Command, id: string, cmdOpts) {
      try {
        const data = await readJsonInput(cmdOpts);

        const client = await clientFactory.createPlatformClient(parent.optsWithGlobals<PlatformCommandOptions>());
        const user = await client.adminUsers.update(id, data);

        console.log(`✓ Updated user: ${user.id}`);
        const globalOpts = parent.optsWithGlobals<PlatformCommandOptions>();
        renderData(user, getOutputMode(globalOpts));
      } catch (error) {
        handleCommandError(error);
        process.exitCode = 1;
      }
    });

  // Delete user
  users
    .command("delete <id>")
    .description("Delete a user")
    .option("--yes", "Skip confirmation prompt")
    .action(async function(this: Command, id: string, cmdOpts) {
      try {
        if (!cmdOpts.yes) {
          console.error("Error: Delete requires --yes confirmation flag");
          process.exitCode = 1;
          return;
        }

        const client = await clientFactory.createPlatformClient(parent.optsWithGlobals<PlatformCommandOptions>());
        await client.adminUsers.delete(id);

        console.log(`✓ Deleted user: ${id}`);
      } catch (error) {
        handleCommandError(error);
        process.exitCode = 1;
      }
    });

  // Reset password
  users
    .command("reset-password <user-id>")
    .description("Generate password reset token for user")
    .action(async function(this: Command, userId: string) {
      try {
        const client = await clientFactory.createPlatformClient(parent.optsWithGlobals<PlatformCommandOptions>());
        const result = await client.adminUsers.generatePasswordResetToken(userId);

        displayTokenWarning();
        console.log(`Password reset token: ${formatTokenForOutput(result.token)}`);
        console.log(`\nUser can reset password at: /reset-password?token=${formatTokenForOutput(result.token)}`);
      } catch (error) {
        handleCommandError(error);
        process.exitCode = 1;
      }
    });

  // Unlock user
  users
    .command("unlock <user-id>")
    .description("Unlock a locked user account")
    .action(async function(this: Command, userId: string) {
      try {
        const client = await clientFactory.createPlatformClient(parent.optsWithGlobals<PlatformCommandOptions>());
        await client.adminUsers.unlock(userId);

        console.log(`✓ User ${userId} unlocked successfully`);
      } catch (error) {
        handleCommandError(error);
        process.exitCode = 1;
      }
    });
}
