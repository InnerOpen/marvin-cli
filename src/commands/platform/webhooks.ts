import { Command } from "commander";
import { clientFactory } from "../../shared/clients.js";
import type { PlatformCommandOptions } from "../../shared/types.js";
import { renderList, renderData } from "../../output.js";
import { getOutputMode } from "../../shared/types.js";
import { handleCommandError } from "../../shared/error-handler.js";
import { TABLE_SCHEMAS } from "../../shared/table-schemas.js";
import { addDataOptions, readJsonInput } from "../../shared/json-input.js";
import { addPageOptions, fetchPages } from "../../shared/pagination.js";
import { say, emitDeleted, emitOk } from "../../shared/io.js";

export function registerWebhookCommands(parent: Command): void {
  const webhooks = new Command("webhooks")
    .description("Workspace webhooks management");

  parent.addCommand(webhooks);

  // List
  addPageOptions(webhooks
    .command("list")
    .description("List webhooks (one page; --all for every page)"))
    .action(async function(this: Command, cmdOpts) {
      try {
        const client = await clientFactory.createPlatformClient(parent.optsWithGlobals<PlatformCommandOptions>());
        const items = await fetchPages(client, "/api/groups/webhooks", cmdOpts);

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
  addDataOptions(webhooks
    .command("create")
    .description("Create a new webhook"), "webhook data")
    .action(async function(this: Command, cmdOpts) {
      try {
        const data = await readJsonInput(cmdOpts);

        const client = await clientFactory.createPlatformClient(parent.optsWithGlobals<PlatformCommandOptions>());
        const webhook = await client.webhooks.create(data);

        say(`✓ Created webhook: ${webhook.id}`);
        const globalOpts = parent.optsWithGlobals<PlatformCommandOptions>();
        renderData(webhook, getOutputMode(globalOpts));
      } catch (error) {
        handleCommandError(error);
        process.exitCode = 1;
      }
    });

  // Update
  addDataOptions(webhooks
    .command("update <id>")
    .description("Update a webhook"), "webhook data")
    .action(async function(this: Command, id: string, cmdOpts) {
      try {
        const data = await readJsonInput(cmdOpts);

        const client = await clientFactory.createPlatformClient(parent.optsWithGlobals<PlatformCommandOptions>());
        const webhook = await client.webhooks.update(id, data);

        say(`✓ Updated webhook: ${webhook.id}`);
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

        emitDeleted(id, getOutputMode(parent.optsWithGlobals<PlatformCommandOptions>()), `✓ Deleted webhook: ${id}`);
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
        const lines = ["✓ Webhook test scheduled"];
        if (result?.message) lines.push(result.message);
        emitOk(result, getOutputMode(parent.optsWithGlobals<PlatformCommandOptions>()), ...lines);
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
    .description("Re-fire today's scheduled webhooks (everything due since 00:00 UTC), in the background")
    .action(async function(this: Command) {
      try {
        const client = await clientFactory.createPlatformClient(parent.optsWithGlobals<PlatformCommandOptions>());
        const result = await client.webhooks.rerun();

        const lines = [`✓ ${result?.message ?? "Webhook rerun started"}`];
        if (typeof result?.requeued === "number") lines.push(`Requeued: ${result.requeued} webhooks`);
        emitOk(result, getOutputMode(parent.optsWithGlobals<PlatformCommandOptions>()), ...lines);
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
