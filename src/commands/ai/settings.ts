import { Command } from "commander";
import { clientFactory } from "../../shared/clients.js";
import { renderData } from "../../output.js";
import { getOutputMode, type PlatformCommandOptions } from "../../shared/types.js";
import { addDataOptions, readJsonInput } from "../../shared/json-input.js";
import { say } from "../../shared/io.js";
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
  addDataOptions(settings
    .command("update")
    .description("Update workspace AI settings"), "settings data")
    .action(async function(this: Command, cmdOpts) {
      try {
        const data = await readJsonInput(cmdOpts);

        const opts = this.optsWithGlobals<PlatformCommandOptions>();
        const client = await clientFactory.createPlatformClient(opts);

        const result = await client.ai.settings.update(data);
        say(`✓ Updated workspace AI settings`);
        renderData(result, getOutputMode(opts));
      } catch (error) {
        handleCommandError(error);
      }
    });
}
