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
    .command("upload <file-path>")
    .description("Upload a new asset file")
    .requiredOption("--slug <slug>", "URL-friendly slug for the asset")
    .requiredOption("--name <name>", "Display name for the asset")
    .option("--alt-text <text>", "Alt text for accessibility")
    .option("--description <text>", "Description of the asset")
    .option("--metadata <json>", "Custom metadata as JSON string")
    .action(async function(this: Command, filePath: string, cmdOpts) {
      try {
        // Read the file
        const fileBuffer = readFileSync(filePath);
        const fileName = basename(filePath);

        // Create a File-like Blob from the buffer
        const blob = new Blob([fileBuffer]) as File;

        // Parse metadata if provided
        let metadata = undefined;
        if (cmdOpts.metadata) {
          try {
            metadata = JSON.parse(cmdOpts.metadata);
          } catch (e) {
            console.error("Error: Invalid JSON in --metadata");
            process.exitCode = 1;
            return;
          }
        }

        // Build upload metadata
        const uploadData = {
          slug: cmdOpts.slug,
          name: cmdOpts.name,
          altText: cmdOpts.altText,
          description: cmdOpts.description,
          metadata,
        };

        const opts = this.optsWithGlobals<PlatformCommandOptions>();
        const client = await clientFactory.createPlatformClient(opts);

        // Upload via SDK
        const asset = await client.assets.upload(blob, uploadData);

        console.log(`✓ Uploaded asset: ${asset.id}`);
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
