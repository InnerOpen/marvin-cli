import { Command } from "commander";
import { clientFactory } from "../../shared/clients.js";
import type { PlatformCommandOptions } from "../../shared/types.js";
import { renderList, renderData } from "../../output.js";

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
        const page = parseInt(cmdOpts.page);
        const perPage = parseInt(cmdOpts.perPage);

        const result = await client.adminUsers.list(page, perPage);

        const globalOpts = parent.optsWithGlobals<PlatformCommandOptions>();
        renderList(result.items || [] as any, [
          { key: 'id', header: 'ID' },
          { key: 'username', header: 'Username' },
          { key: 'email', header: 'Email' },
          { key: 'admin', header: 'Admin' },
        ] as any, globalOpts.output as any || 'table');
      } catch (error) {
        console.error(error instanceof Error ? error.message : error);
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
        renderData(user, globalOpts.output as any || 'table');
      } catch (error) {
        console.error(error instanceof Error ? error.message : error);
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

        console.log(`Password reset token: ${result.token}`);
        console.log(`\nUser can reset password at: /reset-password?token=${result.token}`);
      } catch (error) {
        console.error(error instanceof Error ? error.message : error);
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
        console.error(error instanceof Error ? error.message : error);
        process.exitCode = 1;
      }
    });
}
