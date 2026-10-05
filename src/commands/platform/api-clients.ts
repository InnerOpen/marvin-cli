import { Command } from "commander";
import { clientFactory } from "../../shared/clients.js";
import { renderList, renderData } from "../../output.js";
import { getOutputMode, type PlatformCommandOptions } from "../../shared/types.js";
import { handleCommandError } from "../../shared/error-handler.js";
import { formatTokenForOutput, displayTokenWarning } from "../../shared/security.js";
import { TABLE_SCHEMAS } from "../../shared/table-schemas.js";
import { addDataOptions, readJsonInput } from "../../shared/json-input.js";
import { say, emitDeleted } from "../../shared/io.js";

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
        renderList(apiClients as any[], TABLE_SCHEMAS['api-clients.list'], getOutputMode(opts));
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

  addDataOptions(apiClients
    .command("create")
    .description("Create a new API client (returns client with token)"), "API client data")
    .option("--name <name>", "API client name")
    .option("--description <description>", "API client description")
    .action(async function(this: Command, cmdOpts) {
      try {
        let data: any;

        if (cmdOpts.data !== undefined || cmdOpts.file) {
          data = await readJsonInput(cmdOpts);
        } else if (cmdOpts.name) {
          // Allow quick creation via flags
          data = {
            name: cmdOpts.name,
            description: cmdOpts.description,
          };
        } else {
          console.error("Error: Provide API client data via --data, --file, or --name");
          process.exitCode = 1;
          return;
        }

        const opts = this.optsWithGlobals<PlatformCommandOptions>();
        const client = await clientFactory.createPlatformClient(opts);
        const apiClient = await client.apiClients.create(data);

        const token = (apiClient as any).token;

        say(`✓ Created API client: ${apiClient.id}`);
        say(`⚠️  Save this token securely - it won't be shown again!`);
        displayTokenWarning();
        say(`   Token: ${formatTokenForOutput(token)}`);
        renderData(apiClient, getOutputMode(opts));
      } catch (error) {
        handleCommandError(error);
      }
    });

  addDataOptions(apiClients
    .command("update <id>")
    .description("Update an API client"), "API client data")
    .option("--name <name>", "API client name")
    .option("--description <description>", "API client description")
    .action(async function(this: Command, id: string, cmdOpts) {
      try {
        let data: any;

        if (cmdOpts.data !== undefined || cmdOpts.file) {
          data = await readJsonInput(cmdOpts);
        } else if (cmdOpts.name || cmdOpts.description) {
          // Allow quick update via flags
          data = {};
          if (cmdOpts.name) data.name = cmdOpts.name;
          if (cmdOpts.description) data.description = cmdOpts.description;
        } else {
          console.error("Error: Provide API client data via --data, --file, --name, or --description");
          process.exitCode = 1;
          return;
        }

        const opts = this.optsWithGlobals<PlatformCommandOptions>();
        const client = await clientFactory.createPlatformClient(opts);
        const apiClient = await client.apiClients.update(id, data);

        say(`✓ Updated API client: ${apiClient.id}`);
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
        emitDeleted(id, getOutputMode(opts), `✓ Deleted API client: ${id}`);
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

        say(`✓ Rotated token for API client: ${apiClient.id}`);
        say(`⚠️  Save this token securely - it won't be shown again!`);
        displayTokenWarning();
        say(`   New Token: ${formatTokenForOutput(token)}`);
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
