import { Command } from "commander";
import { clientFactory } from "../../shared/clients.js";
import { getOutputMode } from '../../shared/types.js';
import { handleCommandError } from '../../shared/error-handler.js';
import type { PlatformCommandOptions } from "../../shared/types.js";
import { renderList, renderData } from "../../output.js";
import { readJsonInput } from "../../shared/json-input.js";

export function registerAdminEmailCommands(parent: Command): void {
  const email = new Command("email")
    .description("Email settings and templates (requires SUPER_ADMIN)");

  parent.addCommand(email);

  // Email settings
  email
    .command("settings")
    .description("Get email settings")
    .action(async function(this: Command) {
      try {
        const client = await clientFactory.createPlatformClient(parent.optsWithGlobals<PlatformCommandOptions>());
        const result = await client.adminSystem.getEmailSettings();

        const globalOpts = parent.optsWithGlobals<PlatformCommandOptions>();
        renderData(result, getOutputMode(globalOpts));
      } catch (error) {
        handleCommandError(error);
        process.exitCode = 1;
      }
    });

  // Send test email
  email
    .command("test <email>")
    .description("Send a test email using the configured SMTP settings")
    .action(async function(this: Command, address: string) {
      try {
        const client = await clientFactory.createPlatformClient(parent.optsWithGlobals<PlatformCommandOptions>());
        await client.adminSystem.sendTestEmail({ email: address });

        console.log(`✓ Test email sent to ${address}`);
      } catch (error) {
        handleCommandError(error);
        process.exitCode = 1;
      }
    });

  // Templates subcommand
  const templates = new Command("templates")
    .description("Manage system email templates");

  email.addCommand(templates);

  // List templates
  templates
    .command("list")
    .description("List all system email templates")
    .action(async function(this: Command) {
      try {
        const client = await clientFactory.createPlatformClient(parent.optsWithGlobals<PlatformCommandOptions>());
        const result = await client.adminSystem.listEmailTemplates();

        const globalOpts = parent.optsWithGlobals<PlatformCommandOptions>();
        renderList(result as any[], {
          id: 'id',
          name: 'name',
          templateType: 'templateType',
          enabled: 'enabled',
          groupId: 'groupId',
        } as any, getOutputMode(globalOpts));
      } catch (error) {
        handleCommandError(error);
        process.exitCode = 1;
      }
    });

  // Get template
  templates
    .command("get <id>")
    .description("Get a system email template by ID")
    .action(async function(this: Command, id: string) {
      try {
        const client = await clientFactory.createPlatformClient(parent.optsWithGlobals<PlatformCommandOptions>());
        const result = await client.adminSystem.getEmailTemplate(id);

        const globalOpts = parent.optsWithGlobals<PlatformCommandOptions>();
        renderData(result, getOutputMode(globalOpts));
      } catch (error) {
        handleCommandError(error);
        process.exitCode = 1;
      }
    });

  // Create template
  templates
    .command("create")
    .description("Create a new system email template")
    .option("--json <json>", "Template data as JSON string")
    .option("--file <path>", "Path to JSON file with template data (use '-' for stdin)")
    .action(async function(this: Command, cmdOpts) {
      try {
        const data = await readJsonInput(cmdOpts);

        const client = await clientFactory.createPlatformClient(parent.optsWithGlobals<PlatformCommandOptions>());
        const result = await client.adminSystem.createEmailTemplate(data);

        console.log(`✓ Created email template: ${result.id}`);
        const globalOpts = parent.optsWithGlobals<PlatformCommandOptions>();
        renderData(result, getOutputMode(globalOpts));
      } catch (error) {
        handleCommandError(error);
        process.exitCode = 1;
      }
    });

  // Update template
  templates
    .command("update <id>")
    .description("Update a system email template")
    .option("--json <json>", "Template data as JSON string")
    .option("--file <path>", "Path to JSON file with template data (use '-' for stdin)")
    .action(async function(this: Command, id: string, cmdOpts) {
      try {
        const data = await readJsonInput(cmdOpts);

        const client = await clientFactory.createPlatformClient(parent.optsWithGlobals<PlatformCommandOptions>());
        const result = await client.adminSystem.updateEmailTemplate(id, data);

        console.log(`✓ Updated email template: ${result.id}`);
        const globalOpts = parent.optsWithGlobals<PlatformCommandOptions>();
        renderData(result, getOutputMode(globalOpts));
      } catch (error) {
        handleCommandError(error);
        process.exitCode = 1;
      }
    });

  // Send template test
  templates
    .command("test <id> <email>")
    .description("Send a test email using a system template")
    .action(async function(this: Command, id: string, address: string) {
      try {
        const client = await clientFactory.createPlatformClient(parent.optsWithGlobals<PlatformCommandOptions>());
        await client.adminSystem.sendEmailTemplateTest(id, address);

        console.log(`✓ Test email for template ${id} sent to ${address}`);
      } catch (error) {
        handleCommandError(error);
        process.exitCode = 1;
      }
    });

  // Delete template
  templates
    .command("delete <id>")
    .description("Delete a system email template")
    .option("--yes", "Skip confirmation prompt")
    .action(async function(this: Command, id: string, cmdOpts) {
      try {
        if (!cmdOpts.yes) {
          console.error("Error: Delete requires --yes confirmation flag");
          process.exitCode = 1;
          return;
        }

        const client = await clientFactory.createPlatformClient(parent.optsWithGlobals<PlatformCommandOptions>());
        await client.adminSystem.deleteEmailTemplate(id);

        console.log(`✓ Deleted email template: ${id}`);
      } catch (error) {
        handleCommandError(error);
        process.exitCode = 1;
      }
    });
}
