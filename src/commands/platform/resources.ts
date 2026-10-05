import { handleCommandError } from '../../shared/error-handler.js';
import { say, emitDeleted } from "../../shared/io.js";
import { Command } from "commander";
import { clientFactory } from "../../shared/clients.js";
import { renderList, renderData } from "../../output.js";
import { getOutputMode, type PlatformCommandOptions } from "../../shared/types.js";
import { TABLE_SCHEMAS } from "../../shared/table-schemas.js";
import { addDataOptions, readJsonInput } from "../../shared/json-input.js";

export function registerPlatformResourceCommands(parent: Command): void {
  const resources = parent
    .command("resources")
    .description("Resource CRUD operations");

  resources
    .command("list")
    .description("List resources")
    .action(async function(this: Command) {
      try {
        const opts = this.optsWithGlobals<PlatformCommandOptions>();
        const client = await clientFactory.createPlatformClient(opts);
        const resources = await client.resources.list();
        renderList(resources as any[], TABLE_SCHEMAS['resources.list'], getOutputMode(opts));
      } catch (error) {
        handleCommandError(error);
        process.exitCode = 1;
      }
    });

  resources
    .command("get <id>")
    .description("Get resource by ID")
    .action(async function(this: Command, id: string) {
      try {
        const opts = this.optsWithGlobals<PlatformCommandOptions>();
        const client = await clientFactory.createPlatformClient(opts);
        const resource = await client.resources.get(id);
        renderData(resource, getOutputMode(opts));
      } catch (error) {
        handleCommandError(error);
        process.exitCode = 1;
      }
    });

  addDataOptions(resources
    .command("create")
    .description("Create a new resource"), "resource data")
    .action(async function(this: Command, cmdOpts) {
      try {
        const data = await readJsonInput(cmdOpts);

        const opts = this.optsWithGlobals<PlatformCommandOptions>();
        const client = await clientFactory.createPlatformClient(opts);
        const resource = await client.resources.create(data);
        say(`✓ Created resource: ${resource.id}`);
        renderData(resource, getOutputMode(opts));
      } catch (error) {
        handleCommandError(error);
        process.exitCode = 1;
      }
    });

  addDataOptions(resources
    .command("update <id>")
    .description("Update a resource"), "resource data")
    .action(async function(this: Command, id: string, cmdOpts) {
      try {
        const data = await readJsonInput(cmdOpts);

        const opts = this.optsWithGlobals<PlatformCommandOptions>();
        const client = await clientFactory.createPlatformClient(opts);
        const resource = await client.resources.update(id, data);
        say(`✓ Updated resource: ${resource.id}`);
        renderData(resource, getOutputMode(opts));
      } catch (error) {
        handleCommandError(error);
        process.exitCode = 1;
      }
    });

  resources
    .command("delete <id>")
    .description("Delete a resource")
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
        await client.resources.delete(id);
        emitDeleted(id, getOutputMode(opts), `✓ Deleted resource: ${id}`);
      } catch (error) {
        handleCommandError(error);
        process.exitCode = 1;
      }
    });
}
