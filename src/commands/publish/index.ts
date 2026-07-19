import { Command } from "commander";
import { registerSiteCommands } from "./site.js";
import { registerEntryCommands } from "./entries.js";
import { registerCollectionCommands } from "./collections.js";
import { registerResourceCommands } from "./resources.js";
import { registerAssetCommands } from "./assets.js";
import { registerRendererCommands } from "./renderers.js";

/**
 * Create the 'publish' command group
 * All commands under this group use the Publishing API (read-only, site token)
 */
export function createPublishCommand(): Command {
  const publish = new Command("publish")
    .description("Publishing API commands (read-only, requires site token)")
    .option("--site-token <token>", "Site client token, overrides MARVIN_SITE_CLIENT_TOKEN")
    .option("--token <token>", "Alias for --site-token");

  // Register subcommands
  registerSiteCommands(publish);
  registerEntryCommands(publish);
  registerCollectionCommands(publish);
  registerResourceCommands(publish);
  registerAssetCommands(publish);
  registerRendererCommands(publish);

  return publish;
}
