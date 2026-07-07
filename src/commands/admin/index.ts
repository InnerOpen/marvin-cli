import { Command } from "commander";
import { registerAdminUsersCommands } from "./users.js";
import { registerAdminSystemCommands } from "./system.js";
import { registerAdminMaintenanceCommands } from "./maintenance.js";

/**
 * Create the 'admin' command group
 * Administrative commands (requires SUPER_ADMIN or specific permissions)
 */
export function createAdminCommand(): Command {
  const admin = new Command("admin")
    .description("Administrative commands (requires SUPER_ADMIN)")
    .option("--user-token <token>", "User authentication token, overrides MARVIN_USER_TOKEN");

  // Register subcommands
  registerAdminUsersCommands(admin);
  registerAdminSystemCommands(admin);
  registerAdminMaintenanceCommands(admin);

  return admin;
}
