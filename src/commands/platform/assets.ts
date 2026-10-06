import { handleCommandError } from '../../shared/error-handler.js';
import { Command } from "commander";
import { readFileSync, statSync } from "fs";
import { basename } from "path";
import { Blob } from "buffer";
import { clientFactory } from "../../shared/clients.js";
import { renderList, renderData } from "../../output.js";
import { getOutputMode, type PlatformCommandOptions } from "../../shared/types.js";
import { TABLE_SCHEMAS } from "../../shared/table-schemas.js";
import { addDataOptions, readJsonInput } from "../../shared/json-input.js";
import { say, emitDeleted } from "../../shared/io.js";
import { requireDownloadTarget, writeDownload } from "../../shared/download.js";
import { registerSuggestionCommands } from "../../shared/review.js";

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
        renderList(assets as any[], TABLE_SCHEMAS['assets.list'], getOutputMode(opts));
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
        say(`Uploading ${filename} (${(stats.size / 1024).toFixed(2)} KB)...`);
        const asset = await client.assets.upload(file, {
          slug: cmdOpts.slug,
          name: cmdOpts.name,
          altText: cmdOpts.altText,
          description: cmdOpts.description,
          metadata,
        });

        say(`✓ Uploaded asset: ${asset.id}`);
        say(`  Public URL: ${asset.publicUrl || 'N/A'}`);
        say(`  Type: ${asset.assetType}`);
        say(`  MIME: ${asset.mimeType}`);
        say(`  Size: ${(asset.fileSize / 1024).toFixed(2)} KB`);
        say(`  Checksum: ${asset.checksum}`);

        if (asset.width && asset.height) {
          say(`  Dimensions: ${asset.width} × ${asset.height}`);
        }

        renderData(asset, getOutputMode(opts));
      } catch (error) {
        handleCommandError(error);
        process.exitCode = 1;
      }
    });

  assets
    .command("download <id>")
    .description("Download the raw file for an asset (to --out-file, or to stdout when it is piped)")
    .option("-o, --out-file <file>", "Write the file to this path instead of stdout")
    .action(async function(this: Command, id: string, cmdOpts: { outFile?: string }) {
      try {
        const opts = this.optsWithGlobals<PlatformCommandOptions>();
        const mode = getOutputMode(opts);
        requireDownloadTarget(cmdOpts.outFile);
        const client = await clientFactory.createPlatformClient(opts);
        const file = await client.assets.download(id);
        writeDownload(file, cmdOpts.outFile, mode);
      } catch (error) {
        handleCommandError(error);
      }
    });

  addDataOptions(assets
    .command("update <id>")
    .description("Update an asset"), "asset data")
    .action(async function(this: Command, id: string, cmdOpts) {
      try {
        const data = await readJsonInput(cmdOpts);

        const opts = this.optsWithGlobals<PlatformCommandOptions>();
        const client = await clientFactory.createPlatformClient(opts);
        const asset = await client.assets.update(id, data);
        say(`✓ Updated asset: ${asset.id}`);
        renderData(asset, getOutputMode(opts));
      } catch (error) {
        handleCommandError(error);
        process.exitCode = 1;
      }
    });

  registerSuggestionCommands(assets, "assets");

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
        emitDeleted(id, getOutputMode(opts), `✓ Deleted asset: ${id}`);
      } catch (error) {
        handleCommandError(error);
        process.exitCode = 1;
      }
    });
}
