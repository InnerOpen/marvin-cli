import { Command } from "commander";
import { clientFactory } from "../../shared/clients.js";
import type { PlatformCommandOptions } from "../../shared/types.js";
import { renderData } from "../../output.js";

export function registerAdminMaintenanceCommands(parent: Command): void {
  const maintenance = new Command("maintenance")
    .description("System maintenance operations");

  parent.addCommand(maintenance);

  // Clean temp
  maintenance
    .command("clean-temp")
    .description("Clean temporary files")
    .action(async function(this: Command) {
      try {
        const client = await clientFactory.createPlatformClient(parent.optsWithGlobals<PlatformCommandOptions>());
        const result = await client.adminMaintenance.cleanTemp();
        console.log(result.message);
      } catch (error) {
        console.error(error instanceof Error ? error.message : error);
        process.exitCode = 1;
      }
    });

  // Cleanup
  maintenance
    .command("cleanup")
    .description("Run all cleanup operations (events, tokens)")
    .action(async function(this: Command) {
      try {
        const client = await clientFactory.createPlatformClient(parent.optsWithGlobals<PlatformCommandOptions>());

        console.log("Cleaning up events...");
        const events = await client.adminMaintenance.cleanupEvents();
        console.log(`✓ ${events.message} (${events.deleted} deleted)`);

        console.log("\nCleaning up tokens...");
        const tokens = await client.adminMaintenance.cleanupTokens();
        console.log(`✓ ${tokens.message} (${tokens.deleted} deleted)`);
      } catch (error) {
        console.error(error instanceof Error ? error.message : error);
        process.exitCode = 1;
      }
    });

  // Clear cache
  maintenance
    .command("clear-cache")
    .description("Clear application cache")
    .action(async function(this: Command) {
      try {
        const client = await clientFactory.createPlatformClient(parent.optsWithGlobals<PlatformCommandOptions>());
        const result = await client.adminMaintenance.clearCache();
        console.log(result.message);
      } catch (error) {
        console.error(error instanceof Error ? error.message : error);
        process.exitCode = 1;
      }
    });

  // Optimize database
  maintenance
    .command("optimize")
    .description("Optimize database")
    .action(async function(this: Command) {
      try {
        const client = await clientFactory.createPlatformClient(parent.optsWithGlobals<PlatformCommandOptions>());
        const result = await client.adminMaintenance.optimizeDatabase();
        console.log(result.message);
      } catch (error) {
        console.error(error instanceof Error ? error.message : error);
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
        renderData(stats, globalOpts.output as any || 'table');
      } catch (error) {
        console.error(error instanceof Error ? error.message : error);
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
        renderData(storage, globalOpts.output as any || 'table');
      } catch (error) {
        console.error(error instanceof Error ? error.message : error);
        process.exitCode = 1;
      }
    });
}
