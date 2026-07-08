import { Command } from "commander";
import { clientFactory } from "../../shared/clients.js";
import type { PlatformCommandOptions } from "../../shared/types.js";
import { renderData } from "../../output.js";

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
        renderData(info, globalOpts.output as any || 'table');
      } catch (error) {
        console.error(error instanceof Error ? error.message : error);
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
        renderData(stats, globalOpts.output as any || 'table');
      } catch (error) {
        console.error(error instanceof Error ? error.message : error);
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

        console.log(`System status: ${health.status}`);
      } catch (error) {
        console.error(error instanceof Error ? error.message : error);
        process.exitCode = 1;
      }
    });
}
