import { Command } from "commander";
import { clientFactory } from "../../shared/clients.js";
import { renderList, renderData } from "../../output.js";
import { getOutputMode, type PlatformCommandOptions } from "../../shared/types.js";
import { platformResourceColumns } from "../../shared/columns.js";
import { readFileSync } from "fs";

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
        renderList(resources as any[], platformResourceColumns, getOutputMode(opts));
      } catch (error) {
        console.error(error instanceof Error ? error.message : error);
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
        console.error(error instanceof Error ? error.message : error);
        process.exitCode = 1;
      }
    });

  resources
    .command("create")
    .description("Create a new resource")
    .option("--json <json>", "Resource data as JSON string")
    .option("--file <path>", "Path to JSON file with resource data")
    .action(async function(this: Command, cmdOpts) {
      try {
        let data: any;
        if (cmdOpts.json) {
          data = JSON.parse(cmdOpts.json);
        } else if (cmdOpts.file) {
          data = JSON.parse(readFileSync(cmdOpts.file, "utf-8"));
        } else {
          console.error("Error: Provide resource data via --json or --file");
          process.exitCode = 1;
          return;
        }

        const opts = this.optsWithGlobals<PlatformCommandOptions>();
        const client = await clientFactory.createPlatformClient(opts);
        const resource = await client.resources.create(data);
        console.log(`✓ Created resource: ${resource.id}`);
        renderData(resource, getOutputMode(opts));
      } catch (error) {
        console.error(error instanceof Error ? error.message : error);
        process.exitCode = 1;
      }
    });

  resources
    .command("update <id>")
    .description("Update a resource")
    .option("--json <json>", "Resource data as JSON string")
    .option("--file <path>", "Path to JSON file with resource data")
    .action(async function(this: Command, id: string, cmdOpts) {
      try {
        let data: any;
        if (cmdOpts.json) {
          data = JSON.parse(cmdOpts.json);
        } else if (cmdOpts.file) {
          data = JSON.parse(readFileSync(cmdOpts.file, "utf-8"));
        } else {
          console.error("Error: Provide resource data via --json or --file");
          process.exitCode = 1;
          return;
        }

        const opts = this.optsWithGlobals<PlatformCommandOptions>();
        const client = await clientFactory.createPlatformClient(opts);
        const resource = await client.resources.update(id, data);
        console.log(`✓ Updated resource: ${resource.id}`);
        renderData(resource, getOutputMode(opts));
      } catch (error) {
        console.error(error instanceof Error ? error.message : error);
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
        console.log(`✓ Deleted resource: ${id}`);
      } catch (error) {
        console.error(error instanceof Error ? error.message : error);
        process.exitCode = 1;
      }
    });
}
