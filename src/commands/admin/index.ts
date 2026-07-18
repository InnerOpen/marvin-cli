import { Command } from "commander";
import { registerAdminUsersCommands } from "./users.js";
import { registerAdminSystemCommands } from "./system.js";
import { registerAdminMaintenanceCommands } from "./maintenance.js";
import { registerAdminBackupCommands } from "./backups.js";
import { registerAdminScheduledTaskCommands } from "./scheduled-tasks.js";
import { registerAdminEmailCommands } from "./email.js";
import { registerAdminGroupCommands } from "./groups.js";
import { registerAdminWorkspaceMemberCommands } from "./workspace-members.js";

/**
 * Create the 'admin' command group
 * Administrative commands (requires SUPER_ADMIN or specific permissions)
 */
export function createAdminCommand(): Command {
  const admin = new Command("admin")
    .description("Administrative commands (requires SUPER_ADMIN)");

  // Note: --user-token flag is intentionally not provided for security reasons
  // (would expose token in shell history). Use MARVIN_USER_TOKEN env var or 'marvin login' instead.

  // Register subcommands
  registerAdminUsersCommands(admin);
  registerAdminSystemCommands(admin);
  registerAdminMaintenanceCommands(admin);
  registerAdminBackupCommands(admin);
  registerAdminScheduledTaskCommands(admin);
  registerAdminEmailCommands(admin);
  registerAdminGroupCommands(admin);
  registerAdminWorkspaceMemberCommands(admin);

  return admin;
}
