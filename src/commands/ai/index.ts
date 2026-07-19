import { Command } from "commander";
import { registerAiProviderCommands } from "./providers.js";
import { registerAiOperationCommands } from "./operations.js";
import { registerAiSettingsCommands } from "./settings.js";

/**
 * Create the 'ai' command group
 * All commands under this group use the Platform AI API (requires user token)
 */
export function createAiCommand(): Command {
  const ai = new Command("ai")
    .description("AI: providers, models, operations, executions, and workspace AI settings (requires user token)");

  // Note: --user-token flag is intentionally not provided for security reasons
  // (would expose token in shell history). Use MARVIN_USER_TOKEN env var or 'marvin login' instead.

  // Register subcommands
  registerAiProviderCommands(ai);
  registerAiOperationCommands(ai);
  registerAiSettingsCommands(ai);

  return ai;
}
