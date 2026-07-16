import { handleCommandError } from '../../shared/error-handler.js';
import { Command } from "commander";
import { readFileSync, createReadStream, statSync } from "fs";
import { basename } from "path";
import { Blob } from "buffer";
import { clientFactory } from "../../shared/clients.js";
import { renderList, renderData } from "../../output.js";
import { getOutputMode, type PlatformCommandOptions } from "../../shared/types.js";
import { platformAssetColumns } from "../../shared/columns.js";

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
        handleCommandError(error);
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
        handleCommandError(error);
        process.exitCode = 1;
      }
    });

  assets
    .command("upload <path>")
    .description("Upload a new asset file")
    .requiredOption("--slug <slug>", "Asset slug (URL-friendly identifier)")
    .requiredOption("--name <name>", "Asset name")
    .option("--alt-text <text>", "Alt text for accessibility")
    .option("--description <text>", "Description of the asset")
    .option("--metadata <json>", "Custom metadata as JSON string")
    .action(async function(this: Command, path: string, cmdOpts) {
      try {
        const opts = this.optsWithGlobals<PlatformCommandOptions>();
        const client = await clientFactory.createPlatformClient(opts);

        // Read file
        const fileBuffer = readFileSync(path);
        const stats = statSync(path);
        const filename = basename(path);

        // Create blob from buffer
        const file = new Blob([fileBuffer]) as File;

        // Parse metadata if provided
        const metadata = cmdOpts.metadata ? JSON.parse(cmdOpts.metadata) : undefined;

        // Upload
        console.log(`Uploading ${filename} (${(stats.size / 1024).toFixed(2)} KB)...`);
        const asset = await client.assets.upload(file, {
          slug: cmdOpts.slug,
          name: cmdOpts.name,
          altText: cmdOpts.altText,
          description: cmdOpts.description,
          metadata,
        });

        console.log(`✓ Uploaded asset: ${asset.id}`);
        console.log(`  Public URL: ${asset.publicUrl || 'N/A'}`);
        console.log(`  Type: ${asset.assetType}`);
        console.log(`  MIME: ${asset.mimeType}`);
        console.log(`  Size: ${(asset.fileSize / 1024).toFixed(2)} KB`);
        console.log(`  Checksum: ${asset.checksum}`);

        if (asset.width && asset.height) {
          console.log(`  Dimensions: ${asset.width} × ${asset.height}`);
        }

        renderData(asset, getOutputMode(opts));
      } catch (error) {
        handleCommandError(error);
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
        handleCommandError(error);
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
        handleCommandError(error);
        process.exitCode = 1;
      }
    });
}
