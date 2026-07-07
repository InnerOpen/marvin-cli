import { Command } from "commander";
import { registerLoginCommands } from "./login.js";
import { registerWorkspaceCommands } from "./workspaces.js";
import { registerWorkspaceMemberCommands } from "./workspace-members.js";
import { registerPlatformEntryCommands } from "./entries.js";
import { registerPlatformCollectionCommands } from "./collections.js";
import { registerPlatformResourceCommands } from "./resources.js";
import { registerPlatformAssetCommands } from "./assets.js";
import { registerEntryTypeCommands } from "./entry-types.js";
import { registerAPIClientCommands } from "./api-clients.js";

/**
 * Create the 'platform' command group
 * All commands under this group use the Platform API (CRUD operations, user token)
 */
export function createPlatformCommand(): Command {
  const platform = new Command("platform")
    .description("Platform API commands (CRUD operations, requires user token)")
    .option("--user-token <token>", "User authentication token, overrides MARVIN_USER_TOKEN");

  // Register subcommands
  registerLoginCommands(platform);
  registerWorkspaceCommands(platform);
  registerWorkspaceMemberCommands(platform);
  registerPlatformEntryCommands(platform);
  registerPlatformCollectionCommands(platform);
  registerPlatformResourceCommands(platform);
  registerPlatformAssetCommands(platform);
  registerEntryTypeCommands(platform);
  registerAPIClientCommands(platform);

  return platform;
}
