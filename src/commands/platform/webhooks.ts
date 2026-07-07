import { Command } from "commander";
import { clientFactory } from "../../shared/clients.js";
import type { PlatformCommandOptions } from "../../shared/types.js";
import { renderList, renderData } from "../../output.js";

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
        renderList(items as any, [
          { key: 'id', header: 'ID' },
          { key: 'name', header: 'Name' },
          { key: 'url', header: 'URL' },
          { key: 'enabled', header: 'Enabled' },
        ] as any, globalOpts.output as any || 'table');
      } catch (error) {
        console.error(error instanceof Error ? error.message : error);
        process.exitCode = 1;
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
        renderData(webhook, globalOpts.output as any || 'table');
      } catch (error) {
        console.error(error instanceof Error ? error.message : error);
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

        if (result.success) {
          console.log("✓ Webhook test successful");
          if (result.statusCode) console.log(`Status code: ${result.statusCode}`);
          if (result.message) console.log(result.message);
        } else {
          console.error("✗ Webhook test failed");
          if (result.statusCode) console.error(`Status code: ${result.statusCode}`);
          if (result.message) console.error(result.message);
          process.exitCode = 1;
        }
      } catch (error) {
        console.error(error instanceof Error ? error.message : error);
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
        console.error(error instanceof Error ? error.message : error);
        process.exitCode = 1;
      }
    });
}
