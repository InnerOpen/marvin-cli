import { Command } from "commander";
import { clientFactory } from "../../shared/clients.js";
import { renderData } from "../../output.js";
import { getOutputMode, type PublishCommandOptions } from "../../shared/types.js";

export function registerSiteCommands(parent: Command): void {
  parent
    .command("site")
    .description("Fetch workspace site configuration")
    .action(async function(this: Command) {
      try {
        const opts = this.optsWithGlobals<PublishCommandOptions>();

        // Normalize token option (--token is alias for --site-token)
        if (!opts.token && (opts as any).siteToken) {
          opts.token = (opts as any).siteToken;
        }

        const client = clientFactory.createPublishClient(opts);
        await client.initialize();
        renderData(client.site, getOutputMode(opts));
      } catch (error) {
        console.error(error instanceof Error ? error.message : error);
        process.exitCode = 1;
      }
    });
}
