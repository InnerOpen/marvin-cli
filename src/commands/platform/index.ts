import { Command } from "commander";
import { registerWorkspaceMemberCommands } from "./workspace-members.js";
import { registerPlatformEntryCommands } from "./entries.js";
import { registerPlatformCollectionCommands } from "./collections.js";
import { registerPlatformResourceCommands } from "./resources.js";
import { registerPlatformAssetCommands } from "./assets.js";
import { registerEntryTypeCommands } from "./entry-types.js";
import { registerAPIClientCommands } from "./api-clients.js";
import { registerNotificationCommands } from "./notifications.js";
import { registerWebhookCommands } from "./webhooks.js";
import { registerInviteCommands } from "./invites.js";
import { registerEventLogCommands } from "./event-log.js";
import { registerEmailTemplateCommands } from "./email-templates.js";
import { registerScheduledTaskCommands } from "./scheduled-tasks.js";
import { registerPlatformFormCommands } from "./forms.js";

/**
 * Create the 'platform' command group
 * All commands under this group use the Platform API (CRUD operations, user token)
 */
export function createPlatformCommand(): Command {
  const platform = new Command("platform")
    .description("Platform API commands (CRUD operations, requires user token)")
    .option("--user-token <token>", "User authentication token, overrides MARVIN_USER_TOKEN");

  // Register subcommands
  registerWorkspaceMemberCommands(platform);
  registerPlatformEntryCommands(platform);
  registerPlatformCollectionCommands(platform);
  registerPlatformResourceCommands(platform);
  registerPlatformAssetCommands(platform);
  registerEntryTypeCommands(platform);
  registerAPIClientCommands(platform);
  registerNotificationCommands(platform);
  registerWebhookCommands(platform);
  registerInviteCommands(platform);
  registerEventLogCommands(platform);
  registerEmailTemplateCommands(platform);
  registerScheduledTaskCommands(platform);
  registerPlatformFormCommands(platform);

  return platform;
}
