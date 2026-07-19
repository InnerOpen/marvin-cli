import { Command } from "commander";
import { clientFactory } from "../../shared/clients.js";
import { renderData } from "../../output.js";
import { getOutputMode, type PlatformCommandOptions } from "../../shared/types.js";
import { readJsonInput } from "../../shared/json-input.js";
import { handleCommandError } from "../../shared/error-handler.js";

export function registerAiSettingsCommands(parent: Command): void {
  const settings = parent
    .command("settings")
    .description("Workspace AI settings");

  // Show settings
  settings
    .command("show")
    .description("Show workspace AI settings")
    .action(async function(this: Command) {
      try {
        const opts = this.optsWithGlobals<PlatformCommandOptions>();
        const client = await clientFactory.createPlatformClient(opts);

        const result = await client.ai.settings.get();
        renderData(result, getOutputMode(opts));
      } catch (error) {
        handleCommandError(error);
      }
    });

  // Update settings
  settings
    .command("update")
    .description("Update workspace AI settings")
    .option("--json <json>", "Settings data as JSON string")
    .option("--file <path>", "Path to JSON file with settings data (use '-' for stdin)")
    .action(async function(this: Command, cmdOpts) {
      try {
        const data = await readJsonInput(cmdOpts);

        const opts = this.optsWithGlobals<PlatformCommandOptions>();
        const client = await clientFactory.createPlatformClient(opts);

        const result = await client.ai.settings.update(data);
        console.log(`✓ Updated workspace AI settings`);
        renderData(result, getOutputMode(opts));
      } catch (error) {
        handleCommandError(error);
      }
    });
}
