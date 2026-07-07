import { Command } from "commander";
import { clientFactory } from "../../shared/clients.js";
import { renderList } from "../../output.js";
import { getOutputMode, type PublishCommandOptions } from "../../shared/types.js";
import { assetColumns } from "../../shared/columns.js";
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
        console.error(error instanceof Error ? error.message : error);
        process.exitCode = 1;
      }
    });

  // Get single asset
  parent
    .command("asset <slug>")
    .description("Fetch one asset by slug")
    .action(async function(this: Command, slug: string) {
      try {
        const opts = this.optsWithGlobals<PublishCommandOptions>();

        // Normalize token option
        if (!opts.token && (opts as any).siteToken) {
          opts.token = (opts as any).siteToken;
        }

        const client = clientFactory.createPublishClient(opts);
        const asset = await client.assets.get(slug);

        renderList([asset] as MarvinAsset[], assetColumns, getOutputMode(opts));
      } catch (error) {
        console.error(error instanceof Error ? error.message : error);
        process.exitCode = 1;
      }
    });
}
