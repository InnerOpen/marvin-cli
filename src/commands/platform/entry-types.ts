import { Command } from "commander";
import { clientFactory } from "../../shared/clients.js";
import { renderList, renderData } from "../../output.js";
import { getOutputMode, type PlatformCommandOptions } from "../../shared/types.js";
import { handleCommandError } from "../../shared/error-handler.js";

export function registerEntryTypeCommands(parent: Command): void {
  const entryTypes = parent
    .command("entry-types")
    .description("Entry type operations (read-only)");

  entryTypes
    .command("list")
    .description("List entry types")
    .action(async function(this: Command) {
      try {
        const opts = this.optsWithGlobals<PlatformCommandOptions>();
        const client = await clientFactory.createPlatformClient(opts);
        const entryTypes = await client.entryTypes.list();
        renderList(entryTypes, {
          ID: "id",
          Name: "name",
          Slug: "slug",
          Renderer: (et: any) => et.rendering?.renderer || "",
          Package: (et: any) => et.rendering?.package || "",
          Publishable: (et: any) => et.capabilities?.publishable !== false ? "yes" : "no",
          Routable: (et: any) => et.capabilities?.routable !== false ? "yes" : "no",
        }, getOutputMode(opts));
      } catch (error) {
        handleCommandError(error);
      }
    });

  entryTypes
    .command("get <id>")
    .description("Get entry type by ID")
    .action(async function(this: Command, id: string) {
      try {
        const opts = this.optsWithGlobals<PlatformCommandOptions>();
        const client = await clientFactory.createPlatformClient(opts);
        const entryType = await client.entryTypes.get(id);
        renderData(entryType, getOutputMode(opts));
      } catch (error) {
        handleCommandError(error);
      }
    });
}
