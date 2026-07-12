import { Command } from "commander";
import { clientFactory } from "../../shared/clients.js";
import { renderList } from "../../output.js";
import { getOutputMode, type PublishCommandOptions } from "../../shared/types.js";
import { entryTypeColumns } from "../../shared/columns.js";
import { handleCommandError } from "../../shared/error-handler.js";

export function registerEntryTypeCommands(parent: Command): void {
  parent
    .command("entry-types")
    .description("List entry types with rendering info")
    .action(async function(this: Command) {
      try {
        const opts = this.optsWithGlobals<PublishCommandOptions>();

        if (!opts.token && (opts as any).siteToken) {
          opts.token = (opts as any).siteToken;
        }

        const client = clientFactory.createPublishClient(opts);
        const entryTypes = await client.entryTypes.list();

        renderList(entryTypes, entryTypeColumns, getOutputMode(opts));
      } catch (error) {
        handleCommandError(error);
      }
    });
}
