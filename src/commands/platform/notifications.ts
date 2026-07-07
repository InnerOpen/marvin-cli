import { Command } from "commander";
import { clientFactory } from "../../shared/clients.js";
import type { PlatformCommandOptions } from "../../shared/types.js";
import { renderList, renderData } from "../../output.js";

export function registerNotificationCommands(parent: Command): void {
  const notifications = new Command("notifications")
    .description("Workspace notifications management");

  parent.addCommand(notifications);

  // List
  notifications
    .command("list")
    .description("List all notifications")
    .action(async function(this: Command) {
      try {
        const client = await clientFactory.createPlatformClient(parent.optsWithGlobals<PlatformCommandOptions>());
        const items = await client.notifications.list();

        const globalOpts = parent.optsWithGlobals<PlatformCommandOptions>();
        renderList(items as any, {
          id: 'id',
          name: 'name',
          eventType: 'eventType',
          enabled: 'enabled',
        } as any, globalOpts.output as any || 'table');
      } catch (error) {
        console.error(error instanceof Error ? error.message : error);
        process.exitCode = 1;
      }
    });

  // Get
  notifications
    .command("get <id>")
    .description("Get notification by ID")
    .action(async function(this: Command, id: string) {
      try {
        const client = await clientFactory.createPlatformClient(parent.optsWithGlobals<PlatformCommandOptions>());
        const notification = await client.notifications.get(id);

        const globalOpts = parent.optsWithGlobals<PlatformCommandOptions>();
        renderData(notification, globalOpts.output as any || 'table');
      } catch (error) {
        console.error(error instanceof Error ? error.message : error);
        process.exitCode = 1;
      }
    });

  // Test
  notifications
    .command("test <id>")
    .description("Test a notification")
    .action(async function(this: Command, id: string) {
      try {
        const client = await clientFactory.createPlatformClient(parent.optsWithGlobals<PlatformCommandOptions>());
        const result = await client.notifications.test(id);

        if (result.success) {
          console.log("✓ Notification test successful");
          if (result.message) console.log(result.message);
        } else {
          console.error("✗ Notification test failed");
          if (result.message) console.error(result.message);
          process.exitCode = 1;
        }
      } catch (error) {
        console.error(error instanceof Error ? error.message : error);
        process.exitCode = 1;
      }
    });
}
