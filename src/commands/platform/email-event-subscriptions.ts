import { Command } from "commander";
import { clientFactory } from "../../shared/clients.js";
import { renderList, renderData } from "../../output.js";
import { getOutputMode, type PlatformCommandOptions } from "../../shared/types.js";
import { handleCommandError } from "../../shared/error-handler.js";

export function registerEmailEventSubscriptionCommands(parent: Command): void {
  const emailSubs = parent
    .command("email-subscriptions")
    .description("Email event subscription management");

  // List
  emailSubs
    .command("list")
    .description("List all email event subscriptions")
    .action(async function(this: Command) {
      try {
        const opts = this.optsWithGlobals<PlatformCommandOptions>();
        const client = await clientFactory.createPlatformClient(opts);
        const items = await client.emailEventSubscriptions.list();
        renderList(items as any[], {
          ID: "id",
          "Template ID": "template_id",
          "Event Type": "event_type",
          "Recipient Type": "recipient_type",
          Enabled: "enabled",
        } as any, getOutputMode(opts));
      } catch (error) {
        handleCommandError(error);
      }
    });

  // Get
  emailSubs
    .command("get <id>")
    .description("Get an email event subscription by ID")
    .action(async function(this: Command, id: string) {
      try {
        const opts = this.optsWithGlobals<PlatformCommandOptions>();
        const client = await clientFactory.createPlatformClient(opts);
        const subscription = await client.emailEventSubscriptions.get(id);
        renderData(subscription, getOutputMode(opts));
      } catch (error) {
        handleCommandError(error);
      }
    });

  // Create
  emailSubs
    .command("create")
    .description("Create a new email event subscription")
    .requiredOption("--template-id <id>", "Email template ID")
    .requiredOption("--event-type <type>", "Event type to subscribe to (e.g., entry.published)")
    .option("--recipient-type <type>", "Recipient type: admins, specific, or event_field")
    .option("--recipient-email <email>", "Recipient email address (for specific recipient type)")
    .option("--recipient-field <field>", "Entry field containing recipient email (for event_field type)")
    .action(async function(this: Command, cmdOpts) {
      try {
        const opts = this.optsWithGlobals<PlatformCommandOptions>();
        const client = await clientFactory.createPlatformClient(opts);
        const data: any = {
          template_id: cmdOpts.templateId,
          event_type: cmdOpts.eventType,
        };
        if (cmdOpts.recipientType) data.recipient_type = cmdOpts.recipientType;
        if (cmdOpts.recipientEmail) data.recipient_email = cmdOpts.recipientEmail;
        if (cmdOpts.recipientField) data.recipient_field = cmdOpts.recipientField;
        const subscription = await client.emailEventSubscriptions.create(data);
        console.log(`✓ Created email subscription: ${subscription.id}`);
        renderData(subscription, getOutputMode(opts));
      } catch (error) {
        handleCommandError(error);
      }
    });

  // Delete
  emailSubs
    .command("delete <id>")
    .description("Delete an email event subscription")
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
        await client.emailEventSubscriptions.delete(id);
        console.log(`✓ Deleted email subscription: ${id}`);
      } catch (error) {
        handleCommandError(error);
      }
    });
}
