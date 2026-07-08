import { Command } from "commander";
import { clientFactory } from "../../shared/clients.js";
import { renderList, renderData } from "../../output.js";
import { getOutputMode, type PlatformCommandOptions } from "../../shared/types.js";
import { platformAssetColumns } from "../../shared/columns.js";
import { readFileSync } from "fs";

export function registerPlatformAssetCommands(parent: Command): void {
  const assets = parent
    .command("assets")
    .description("Asset CRUD operations");

  assets
    .command("list")
    .description("List assets")
    .action(async function(this: Command) {
      try {
        const opts = this.optsWithGlobals<PlatformCommandOptions>();
        const client = await clientFactory.createPlatformClient(opts);
        const assets = await client.assets.list();
        renderList(assets as any[], platformAssetColumns, getOutputMode(opts));
      } catch (error) {
        console.error(error instanceof Error ? error.message : error);
        process.exitCode = 1;
      }
    });

  assets
    .command("get <id>")
    .description("Get asset by ID")
    .action(async function(this: Command, id: string) {
      try {
        const opts = this.optsWithGlobals<PlatformCommandOptions>();
        const client = await clientFactory.createPlatformClient(opts);
        const asset = await client.assets.get(id);
        renderData(asset, getOutputMode(opts));
      } catch (error) {
        console.error(error instanceof Error ? error.message : error);
        process.exitCode = 1;
      }
    });

  assets
    .command("update <id>")
    .description("Update an asset")
    .option("--json <json>", "Asset data as JSON string")
    .option("--file <path>", "Path to JSON file with asset data")
    .action(async function(this: Command, id: string, cmdOpts) {
      try {
        let data: any;
        if (cmdOpts.json) {
          data = JSON.parse(cmdOpts.json);
        } else if (cmdOpts.file) {
          data = JSON.parse(readFileSync(cmdOpts.file, "utf-8"));
        } else {
          console.error("Error: Provide asset data via --json or --file");
          process.exitCode = 1;
          return;
        }

        const opts = this.optsWithGlobals<PlatformCommandOptions>();
        const client = await clientFactory.createPlatformClient(opts);
        const asset = await client.assets.update(id, data);
        console.log(`✓ Updated asset: ${asset.id}`);
        renderData(asset, getOutputMode(opts));
      } catch (error) {
        console.error(error instanceof Error ? error.message : error);
        process.exitCode = 1;
      }
    });

  assets
    .command("delete <id>")
    .description("Delete an asset")
    .option("--yes", "Skip confirmation prompt")
    .action(async function(this: Command, id: string, cmdOpts) {
      try {
        if (!cmdOpts.yes) {
          console.error("Error: Delete requires --yes confirmation flag");
          process.exitCode = 1;
          return;
        }

        const opts = this.optsWithGlobals<PlatformCommandOptions>();
        const client = await clientFactory.createPlatformClient(opts);
        await client.assets.delete(id);
        console.log(`✓ Deleted asset: ${id}`);
      } catch (error) {
        console.error(error instanceof Error ? error.message : error);
        process.exitCode = 1;
      }
    });
}
