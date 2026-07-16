import { Command } from "commander";
import { clientFactory } from "../../shared/clients.js";
import { getOutputMode } from '../../shared/types.js';
import { handleCommandError } from '../../shared/error-handler.js';
import type { PlatformCommandOptions } from "../../shared/types.js";
import { renderList, renderData } from "../../output.js";
import { readFileSync } from "fs";
import { TABLE_SCHEMAS } from "../../shared/table-schemas.js";

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
        renderList(items as any[], TABLE_SCHEMAS['notifications.list'], getOutputMode(globalOpts));
      } catch (error) {
        handleCommandError(error);
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
        renderData(notification, getOutputMode(globalOpts));
      } catch (error) {
        handleCommandError(error);
        process.exitCode = 1;
      }
    });

  // Create
  notifications
    .command("create")
    .description("Create a new notification")
    .option("--json <json>", "Notification data as JSON string")
    .option("--file <path>", "Path to JSON file with notification data")
    .action(async function(this: Command, cmdOpts) {
      try {
        let data: any;

        if (cmdOpts.json) {
          data = JSON.parse(cmdOpts.json);
        } else if (cmdOpts.file) {
          data = JSON.parse(readFileSync(cmdOpts.file, "utf-8"));
        } else {
          console.error("Error: Provide notification data via --json or --file");
          process.exitCode = 1;
          return;
        }

        const client = await clientFactory.createPlatformClient(parent.optsWithGlobals<PlatformCommandOptions>());
        const notification = await client.notifications.create(data);

        console.log(`✓ Created notification: ${notification.id}`);
        const globalOpts = parent.optsWithGlobals<PlatformCommandOptions>();
        renderData(notification, getOutputMode(globalOpts));
      } catch (error) {
        handleCommandError(error);
        process.exitCode = 1;
      }
    });

  // Update
  notifications
    .command("update <id>")
    .description("Update a notification")
    .option("--json <json>", "Notification data as JSON string")
    .option("--file <path>", "Path to JSON file with notification data")
    .action(async function(this: Command, id: string, cmdOpts) {
      try {
        let data: any;

        if (cmdOpts.json) {
          data = JSON.parse(cmdOpts.json);
        } else if (cmdOpts.file) {
          data = JSON.parse(readFileSync(cmdOpts.file, "utf-8"));
        } else {
          console.error("Error: Provide notification data via --json or --file");
          process.exitCode = 1;
          return;
        }

        const client = await clientFactory.createPlatformClient(parent.optsWithGlobals<PlatformCommandOptions>());
        const notification = await client.notifications.update(id, data);

        console.log(`✓ Updated notification: ${notification.id}`);
        const globalOpts = parent.optsWithGlobals<PlatformCommandOptions>();
        renderData(notification, getOutputMode(globalOpts));
      } catch (error) {
        handleCommandError(error);
        process.exitCode = 1;
      }
    });

  // Delete
  notifications
    .command("delete <id>")
    .description("Delete a notification")
    .option("--yes", "Skip confirmation prompt")
    .action(async function(this: Command, id: string, cmdOpts) {
      try {
        if (!cmdOpts.yes) {
          console.error("Error: Delete requires --yes confirmation flag");
          process.exitCode = 1;
          return;
        }

        const client = await clientFactory.createPlatformClient(parent.optsWithGlobals<PlatformCommandOptions>());
        await client.notifications.delete(id);

        console.log(`✓ Deleted notification: ${id}`);
      } catch (error) {
        handleCommandError(error);
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
        handleCommandError(error);
        process.exitCode = 1;
      }
    });
}
