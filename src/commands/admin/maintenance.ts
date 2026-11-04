import { Command } from "commander";
import { clientFactory } from "../../shared/clients.js";
import { getOutputMode } from '../../shared/types.js';
import { handleCommandError } from '../../shared/error-handler.js';
import type { PlatformCommandOptions } from "../../shared/types.js";
import { renderData } from "../../output.js";

export function registerAdminMaintenanceCommands(parent: Command): void {
  const maintenance = new Command("maintenance")
    .description("System maintenance information (cleanup runs as scheduled tasks: `admin scheduled-tasks run <slug>`)");

  parent.addCommand(maintenance);

  // Summary
  maintenance
    .command("summary")
    .description("Get the maintenance summary (system overview)")
    .action(async function(this: Command) {
      try {
        const client = await clientFactory.createPlatformClient(parent.optsWithGlobals<PlatformCommandOptions>());
        const summary = await client.adminMaintenance.getSummary();

        const globalOpts = parent.optsWithGlobals<PlatformCommandOptions>();
        renderData(summary, getOutputMode(globalOpts));
      } catch (error) {
        handleCommandError(error);
        process.exitCode = 1;
      }
    });

  // Stats
  maintenance
    .command("stats")
    .description("Get maintenance statistics")
    .action(async function(this: Command) {
      try {
        const client = await clientFactory.createPlatformClient(parent.optsWithGlobals<PlatformCommandOptions>());
        const stats = await client.adminMaintenance.getStats();

        const globalOpts = parent.optsWithGlobals<PlatformCommandOptions>();
        renderData(stats, getOutputMode(globalOpts));
      } catch (error) {
        handleCommandError(error);
        process.exitCode = 1;
      }
    });

  // Storage
  maintenance
    .command("storage")
    .description("Get storage information")
    .action(async function(this: Command) {
      try {
        const client = await clientFactory.createPlatformClient(parent.optsWithGlobals<PlatformCommandOptions>());
        const storage = await client.adminMaintenance.getStorage();

        const globalOpts = parent.optsWithGlobals<PlatformCommandOptions>();
        renderData(storage, getOutputMode(globalOpts));
      } catch (error) {
        handleCommandError(error);
        process.exitCode = 1;
      }
    });
}
