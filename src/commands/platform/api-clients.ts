import { Command } from "commander";
import { clientFactory } from "../../shared/clients.js";
import { renderList, renderData } from "../../output.js";
import { getOutputMode, type PlatformCommandOptions } from "../../shared/types.js";
import { readFileSync } from "fs";
import { handleCommandError } from "../../shared/error-handler.js";
import { formatTokenForOutput, displayTokenWarning } from "../../shared/security.js";

export function registerAPIClientCommands(parent: Command): void {
  const apiClients = parent
    .command("api-clients")
    .description("API client CRUD operations (manage publishing API tokens)");

  apiClients
    .command("list")
    .description("List all API clients")
    .action(async function(this: Command) {
      try {
        const opts = this.optsWithGlobals<PlatformCommandOptions>();
        const client = await clientFactory.createPlatformClient(opts);
        const apiClients = await client.apiClients.list();
        renderList(apiClients, {
          ID: "id",
          Name: "name",
          Description: (c: any) => (c.description || "").substring(0, 50),
          Created: (c: any) => c.createdAt ? new Date(c.createdAt).toISOString().split('T')[0] : "",
        }, getOutputMode(opts));
      } catch (error) {
        handleCommandError(error);
      }
    });

  apiClients
    .command("get <id>")
    .description("Get API client by ID")
    .action(async function(this: Command, id: string) {
      try {
        const opts = this.optsWithGlobals<PlatformCommandOptions>();
        const client = await clientFactory.createPlatformClient(opts);
        const apiClient = await client.apiClients.get(id);
        renderData(apiClient, getOutputMode(opts));
      } catch (error) {
        handleCommandError(error);
      }
    });

  apiClients
    .command("create")
    .description("Create a new API client (returns client with token)")
    .option("--json <json>", "API client data as JSON string")
    .option("--file <path>", "Path to JSON file with API client data")
    .option("--name <name>", "API client name")
    .option("--description <description>", "API client description")
    .action(async function(this: Command, cmdOpts) {
      try {
        let data: any;

        if (cmdOpts.json) {
          data = JSON.parse(cmdOpts.json);
        } else if (cmdOpts.file) {
          data = JSON.parse(readFileSync(cmdOpts.file, "utf-8"));
        } else if (cmdOpts.name) {
          // Allow quick creation via flags
          data = {
            name: cmdOpts.name,
            description: cmdOpts.description,
          };
        } else {
          console.error("Error: Provide API client data via --json, --file, or --name");
          process.exitCode = 1;
          return;
        }

        const opts = this.optsWithGlobals<PlatformCommandOptions>();
        const client = await clientFactory.createPlatformClient(opts);
        const apiClient = await client.apiClients.create(data);

        const token = (apiClient as any).token;

        console.log(`✓ Created API client: ${apiClient.id}`);
        console.log(`⚠️  Save this token securely - it won't be shown again!`);
        displayTokenWarning();
        console.log(`   Token: ${formatTokenForOutput(token)}`);
        renderData(apiClient, getOutputMode(opts));
      } catch (error) {
        handleCommandError(error);
      }
    });

  apiClients
    .command("update <id>")
    .description("Update an API client")
    .option("--json <json>", "API client data as JSON string")
    .option("--file <path>", "Path to JSON file with API client data")
    .option("--name <name>", "API client name")
    .option("--description <description>", "API client description")
    .action(async function(this: Command, id: string, cmdOpts) {
      try {
        let data: any;

        if (cmdOpts.json) {
          data = JSON.parse(cmdOpts.json);
        } else if (cmdOpts.file) {
          data = JSON.parse(readFileSync(cmdOpts.file, "utf-8"));
        } else if (cmdOpts.name || cmdOpts.description) {
          // Allow quick update via flags
          data = {};
          if (cmdOpts.name) data.name = cmdOpts.name;
          if (cmdOpts.description) data.description = cmdOpts.description;
        } else {
          console.error("Error: Provide API client data via --json, --file, --name, or --description");
          process.exitCode = 1;
          return;
        }

        const opts = this.optsWithGlobals<PlatformCommandOptions>();
        const client = await clientFactory.createPlatformClient(opts);
        const apiClient = await client.apiClients.update(id, data);

        console.log(`✓ Updated API client: ${apiClient.id}`);
        renderData(apiClient, getOutputMode(opts));
      } catch (error) {
        handleCommandError(error);
      }
    });

  apiClients
    .command("delete <id>")
    .description("Delete an API client")
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
        await client.apiClients.delete(id);
        console.log(`✓ Deleted API client: ${id}`);
      } catch (error) {
        handleCommandError(error);
      }
    });

  apiClients
    .command("rotate-token <id>")
    .description("Rotate API client token (generates new token, invalidates old one)")
    .action(async function(this: Command, id: string) {
      try {
        const opts = this.optsWithGlobals<PlatformCommandOptions>();
        const client = await clientFactory.createPlatformClient(opts);
        const apiClient = await client.apiClients.rotateToken(id);

        const token = (apiClient as any).token;

        console.log(`✓ Rotated token for API client: ${apiClient.id}`);
        console.log(`⚠️  Save this token securely - it won't be shown again!`);
        displayTokenWarning();
        console.log(`   New Token: ${formatTokenForOutput(token)}`);
        renderData(apiClient, getOutputMode(opts));
      } catch (error) {
        handleCommandError(error);
      }
    });

  apiClients
    .command("preview <id>")
    .description("Preview API client (shows token prefix without revealing full token)")
    .action(async function(this: Command, id: string) {
      try {
        const opts = this.optsWithGlobals<PlatformCommandOptions>();
        const client = await clientFactory.createPlatformClient(opts);
        const apiClient = await client.apiClients.preview(id);

        renderData(apiClient, getOutputMode(opts));
      } catch (error) {
        handleCommandError(error);
      }
    });
}
