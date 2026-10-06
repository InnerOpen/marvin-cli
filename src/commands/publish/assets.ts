import { Command } from "commander";
import { MarvinNotFoundError } from "@inneropen/marvin-sdk";
import { clientFactory } from "../../shared/clients.js";
import { renderList } from "../../output.js";
import { getOutputMode, type PublishCommandOptions } from "../../shared/types.js";
import { assetColumns } from "../../shared/columns.js";
import { handleCommandError } from "../../shared/error-handler.js";
import { requireDownloadTarget, writeDownload } from "../../shared/download.js";
import type { MarvinAsset } from "@inneropen/marvin-sdk/types";

export function registerAssetCommands(parent: Command): void {
  // List assets
  parent
    .command("assets")
    .description("List assets")
    .option("--type <type>", "Filter by asset type")
    .option("--limit <number>", "Limit", (v) => Number(v))
    .option("--offset <number>", "Offset", (v) => Number(v))
    .action(async function(this: Command, cmdOpts) {
      try {
        const opts = this.optsWithGlobals<PublishCommandOptions>();

        // Normalize token option
        if (!opts.token && (opts as any).siteToken) {
          opts.token = (opts as any).siteToken;
        }

        const client = clientFactory.createPublishClient(opts);
        const assets = await client.assets.list({
          type: cmdOpts.type,
          limit: cmdOpts.limit,
          offset: cmdOpts.offset,
        });

        renderList(assets, assetColumns, getOutputMode(opts));
      } catch (error) {
        handleCommandError(error);
      }
    });

  // Get single asset
  parent
    .command("asset <slug>")
    .description("Fetch one asset by slug; --download saves its file")
    .option("--download", "Download the file (to --out-file, or to stdout when it is piped)")
    .option("-o, --out-file <file>", "With --download: write the file here")
    .action(async function(this: Command, slug: string, cmdOpts: { download?: boolean; outFile?: string }) {
      try {
        const opts = this.optsWithGlobals<PublishCommandOptions>();

        // Normalize token option
        if (!opts.token && (opts as any).siteToken) {
          opts.token = (opts as any).siteToken;
        }

        if (cmdOpts.outFile && !cmdOpts.download) throw new Error("--out-file goes with --download");
        if (cmdOpts.download) {
          requireDownloadTarget(cmdOpts.outFile);
          const client = clientFactory.createPublishClient(opts);
          writeDownload(await client.assets.download(slug), cmdOpts.outFile, getOutputMode(opts));
          return;
        }

        const client = clientFactory.createPublishClient(opts);
        try {
          const asset = await client.assets.get(slug);
          renderList(asset ? [asset] as MarvinAsset[] : [], assetColumns, getOutputMode(opts));
        } catch (error) {
          if (error instanceof MarvinNotFoundError) {
            renderList([], assetColumns, getOutputMode(opts));
            process.exitCode = 1;
          } else {
            throw error;
          }
        }
      } catch (error) {
        handleCommandError(error);
      }
    });
}
