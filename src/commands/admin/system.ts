import { Command } from "commander";
import { TABLE_SCHEMAS } from "../../shared/table-schemas.js";
import { clientFactory } from "../../shared/clients.js";
import { getOutputMode } from '../../shared/types.js';
import { handleCommandError } from '../../shared/error-handler.js';
import type { PlatformCommandOptions } from "../../shared/types.js";
import { renderList, renderData } from "../../output.js";

export function registerAdminSystemCommands(parent: Command): void {
  const system = new Command("system")
    .description("System information and settings");

  parent.addCommand(system);

  // System info
  system
    .command("info")
    .description("Get system information")
    .action(async function(this: Command) {
      try {
        const client = await clientFactory.createPlatformClient(parent.optsWithGlobals<PlatformCommandOptions>());
        const info = await client.adminSystem.getAbout();

        const globalOpts = parent.optsWithGlobals<PlatformCommandOptions>();
        renderData(info, getOutputMode(globalOpts));
      } catch (error) {
        handleCommandError(error);
        process.exitCode = 1;
      }
    });

  // System stats
  system
    .command("stats")
    .description("Get system statistics")
    .action(async function(this: Command) {
      try {
        const client = await clientFactory.createPlatformClient(parent.optsWithGlobals<PlatformCommandOptions>());
        const stats = await client.adminSystem.getStatistics();

        const globalOpts = parent.optsWithGlobals<PlatformCommandOptions>();
        renderData(stats, getOutputMode(globalOpts));
      } catch (error) {
        handleCommandError(error);
        process.exitCode = 1;
      }
    });

  // Startup info
  system
    .command("startup-info")
    .description("Get startup information")
    .action(async function(this: Command) {
      try {
        const client = await clientFactory.createPlatformClient(parent.optsWithGlobals<PlatformCommandOptions>());
        const info = await client.adminSystem.getStartupInfo();

        const globalOpts = parent.optsWithGlobals<PlatformCommandOptions>();
        renderData(info, getOutputMode(globalOpts));
      } catch (error) {
        handleCommandError(error);
        process.exitCode = 1;
      }
    });

  // Health check
  system
    .command("health")
    .description("Check system health")
    .action(async function(this: Command) {
      try {
        const client = await clientFactory.createPlatformClient(parent.optsWithGlobals<PlatformCommandOptions>());
        const health = await client.adminSystem.check();

        const mode = getOutputMode(parent.optsWithGlobals<PlatformCommandOptions>());
        if (mode === "table") process.stdout.write(`System status: ${health.status}\n`);
        else renderData(health, mode);
      } catch (error) {
        handleCommandError(error);
        process.exitCode = 1;
      }
    });

  // Installed plugin packages (integration and AI providers)
  system
    .command("plugins")
    .description("List the installed plugin packages, whether each loaded, and the providers they add")
    .action(async function(this: Command) {
      try {
        const opts = parent.optsWithGlobals<PlatformCommandOptions>();
        const client = await clientFactory.createPlatformClient(opts);
        const plugins = await client.adminSystem.listPlugins();
        renderList(plugins, TABLE_SCHEMAS["admin.system.plugins"], getOutputMode(opts));
      } catch (error) {
        handleCommandError(error);
      }
    });
}
