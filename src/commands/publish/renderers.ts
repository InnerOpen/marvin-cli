import { Command } from "commander";
import { clientFactory } from "../../shared/clients.js";
import { renderList } from "../../output.js";
import { getOutputMode, type PublishCommandOptions } from "../../shared/types.js";
import { rendererColumns } from "../../shared/columns.js";
import { handleCommandError } from "../../shared/error-handler.js";

export function registerRendererCommands(parent: Command): void {
  parent
    .command("renderers")
    .description("List renderers required by the workspace")
    .option("--all", "Include entry types without a declared renderer")
    .action(async function(this: Command) {
      try {
        const opts = this.optsWithGlobals<PublishCommandOptions>();
        const localOpts = this.opts();

        if (!opts.token && (opts as any).siteToken) {
          opts.token = (opts as any).siteToken;
        }

        const client = clientFactory.createPublishClient(opts);
        const entryTypes = await client.renderers.list();

        const filtered = localOpts.all
          ? entryTypes
          : entryTypes.filter((et) => et.isRendered);

        renderList(filtered, rendererColumns, getOutputMode(opts));
      } catch (error) {
        handleCommandError(error);
      }
    });
}
