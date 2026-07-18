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
import { registerPlatformEmailCommands } from "./email.js";
import { registerScheduledTaskCommands } from "./scheduled-tasks.js";
import { registerPlatformFormCommands } from "./forms.js";
import { registerSecretCommands } from "./secrets.js";
import { registerVariableCommands } from "./variables.js";
import { registerEmailEventSubscriptionCommands } from "./email-event-subscriptions.js";
import { createAiCommand } from "../ai/index.js";

/**
 * Create the 'platform' command group
 * All commands under this group use the Platform API (CRUD operations, user token)
 */
export function createPlatformCommand(): Command {
  const platform = new Command("platform")
    .description("Platform API commands (CRUD operations, requires user token)");

  // Note: --user-token flag is intentionally not provided for security reasons
  // (would expose token in shell history). Use MARVIN_USER_TOKEN env var or 'marvin login' instead.

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
  registerPlatformEmailCommands(platform);
  registerScheduledTaskCommands(platform);
  registerPlatformFormCommands(platform);
  registerSecretCommands(platform);
  registerVariableCommands(platform);
  registerEmailEventSubscriptionCommands(platform);

  // AI: providers, models, operations, executions, settings (mirrors SDK platform.ai.*)
  platform.addCommand(createAiCommand());

  return platform;
}
