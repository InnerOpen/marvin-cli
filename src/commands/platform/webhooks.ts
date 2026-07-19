import { Command } from "commander";
import { clientFactory } from "../../shared/clients.js";
import type { PlatformCommandOptions } from "../../shared/types.js";
import { renderList, renderData } from "../../output.js";
import { getOutputMode } from "../../shared/types.js";
import { handleCommandError } from "../../shared/error-handler.js";
import { readFileSync } from "fs";
import { TABLE_SCHEMAS } from "../../shared/table-schemas.js";

export function registerWebhookCommands(parent: Command): void {
  const webhooks = new Command("webhooks")
    .description("Workspace webhooks management");

  parent.addCommand(webhooks);

  // List
  webhooks
    .command("list")
    .description("List all webhooks")
    .action(async function(this: Command) {
      try {
        const client = await clientFactory.createPlatformClient(parent.optsWithGlobals<PlatformCommandOptions>());
        const items = await client.webhooks.list();

        const globalOpts = parent.optsWithGlobals<PlatformCommandOptions>();
        renderList(items as any[], TABLE_SCHEMAS['webhooks.list'], getOutputMode(globalOpts));
      } catch (error) {
        handleCommandError(error);
      }
    });

  // Get
  webhooks
    .command("get <id>")
    .description("Get webhook by ID")
    .action(async function(this: Command, id: string) {
      try {
        const client = await clientFactory.createPlatformClient(parent.optsWithGlobals<PlatformCommandOptions>());
        const webhook = await client.webhooks.get(id);

        const globalOpts = parent.optsWithGlobals<PlatformCommandOptions>();
        renderData(webhook, getOutputMode(globalOpts));
      } catch (error) {
        handleCommandError(error);
        process.exitCode = 1;
      }
    });

  // Create
  webhooks
    .command("create")
    .description("Create a new webhook")
    .option("--json <json>", "Webhook data as JSON string")
    .option("--file <path>", "Path to JSON file with webhook data")
    .action(async function(this: Command, cmdOpts) {
      try {
        let data: any;

        if (cmdOpts.json) {
          data = JSON.parse(cmdOpts.json);
        } else if (cmdOpts.file) {
          data = JSON.parse(readFileSync(cmdOpts.file, "utf-8"));
        } else {
          console.error("Error: Provide webhook data via --json or --file");
          process.exitCode = 1;
          return;
        }

        const client = await clientFactory.createPlatformClient(parent.optsWithGlobals<PlatformCommandOptions>());
        const webhook = await client.webhooks.create(data);

        console.log(`✓ Created webhook: ${webhook.id}`);
        const globalOpts = parent.optsWithGlobals<PlatformCommandOptions>();
        renderData(webhook, getOutputMode(globalOpts));
      } catch (error) {
        handleCommandError(error);
        process.exitCode = 1;
      }
    });

  // Update
  webhooks
    .command("update <id>")
    .description("Update a webhook")
    .option("--json <json>", "Webhook data as JSON string")
    .option("--file <path>", "Path to JSON file with webhook data")
    .action(async function(this: Command, id: string, cmdOpts) {
      try {
        let data: any;

        if (cmdOpts.json) {
          data = JSON.parse(cmdOpts.json);
        } else if (cmdOpts.file) {
          data = JSON.parse(readFileSync(cmdOpts.file, "utf-8"));
        } else {
          console.error("Error: Provide webhook data via --json or --file");
          process.exitCode = 1;
          return;
        }

        const client = await clientFactory.createPlatformClient(parent.optsWithGlobals<PlatformCommandOptions>());
        const webhook = await client.webhooks.update(id, data);

        console.log(`✓ Updated webhook: ${webhook.id}`);
        const globalOpts = parent.optsWithGlobals<PlatformCommandOptions>();
        renderData(webhook, getOutputMode(globalOpts));
      } catch (error) {
        handleCommandError(error);
        process.exitCode = 1;
      }
    });

  // Delete
  webhooks
    .command("delete <id>")
    .description("Delete a webhook")
    .option("--yes", "Skip confirmation prompt")
    .action(async function(this: Command, id: string, cmdOpts) {
      try {
        if (!cmdOpts.yes) {
          console.error("Error: Delete requires --yes confirmation flag");
          process.exitCode = 1;
          return;
        }

        const client = await clientFactory.createPlatformClient(parent.optsWithGlobals<PlatformCommandOptions>());
        await client.webhooks.delete(id);

        console.log(`✓ Deleted webhook: ${id}`);
      } catch (error) {
        handleCommandError(error);
        process.exitCode = 1;
      }
    });

  // Test
  webhooks
    .command("test <id>")
    .description("Test a webhook")
    .action(async function(this: Command, id: string) {
      try {
        const client = await clientFactory.createPlatformClient(parent.optsWithGlobals<PlatformCommandOptions>());
        const result = await client.webhooks.test(id);
        console.log("✓ Webhook test scheduled");
        if (result?.message) console.log(result.message);
      } catch (error) {
        handleCommandError(error);
        process.exitCode = 1;
      }
    });

  // Types
  webhooks
    .command("types")
    .description("List the available webhook types")
    .action(async function(this: Command) {
      try {
        const client = await clientFactory.createPlatformClient(parent.optsWithGlobals<PlatformCommandOptions>());
        const types = await client.webhooks.types();

        const globalOpts = parent.optsWithGlobals<PlatformCommandOptions>();
        renderData(types, getOutputMode(globalOpts));
      } catch (error) {
        handleCommandError(error);
        process.exitCode = 1;
      }
    });

  // Rerun
  webhooks
    .command("rerun")
    .description("Rerun failed webhooks")
    .action(async function(this: Command) {
      try {
        const client = await clientFactory.createPlatformClient(parent.optsWithGlobals<PlatformCommandOptions>());
        const result = await client.webhooks.rerun();

        console.log(result.message);
        console.log(`Requeued: ${result.requeued} webhooks`);
      } catch (error) {
        handleCommandError(error);
        process.exitCode = 1;
      }
    });

  // Workspace-wide delivery log
  webhooks
    .command("log")
    .description("Show workspace-wide webhook delivery log")
    .option("--limit <number>", "Maximum number of entries to return", "50")
    .action(async function(this: Command, cmdOpts) {
      try {
        const client = await clientFactory.createPlatformClient(parent.optsWithGlobals<PlatformCommandOptions>());
        const entries = await client.webhooks.log({ limit: parseInt(cmdOpts.limit, 10) });

        const globalOpts = parent.optsWithGlobals<PlatformCommandOptions>();
        renderList(entries as any[], TABLE_SCHEMAS['webhooks.log'], getOutputMode(globalOpts));
      } catch (error) {
        handleCommandError(error);
        process.exitCode = 1;
      }
    });

  // Per-webhook delivery log
  webhooks
    .command("logs <id>")
    .description("Show delivery log for a specific webhook")
    .option("--limit <number>", "Maximum number of entries to return", "50")
    .action(async function(this: Command, id: string, cmdOpts) {
      try {
        const client = await clientFactory.createPlatformClient(parent.optsWithGlobals<PlatformCommandOptions>());
        const entries = await client.webhooks.logs(id, { limit: parseInt(cmdOpts.limit, 10) });

        const globalOpts = parent.optsWithGlobals<PlatformCommandOptions>();
        renderList(entries as any[], TABLE_SCHEMAS['webhooks.logs'], getOutputMode(globalOpts));
      } catch (error) {
        handleCommandError(error);
        process.exitCode = 1;
      }
    });
}
