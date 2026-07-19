import { handleCommandError } from '../../shared/error-handler.js';
import { Command } from "commander";
import { clientFactory } from "../../shared/clients.js";
import { renderData } from "../../output.js";
import { getOutputMode, type PlatformCommandOptions } from "../../shared/types.js";
import { readJsonInput } from "../../shared/json-input.js";

export function registerPlatformEmailCommands(parent: Command): void {
  const email = parent
    .command("email")
    .description("System-level email operations (templates, SMTP)");

  // Template variables for a template type
  email
    .command("template-vars")
    .description("Get available template variables for a template type")
    .requiredOption("--type <type>", "Template type")
    .action(async function(this: Command, cmdOpts) {
      try {
        const opts = this.optsWithGlobals<PlatformCommandOptions>();
        const client = await clientFactory.createPlatformClient(opts);
        const vars = await client.emailTemplates.getTemplateVars(cmdOpts.type);
        renderData(vars, getOutputMode(opts));
      } catch (error) {
        handleCommandError(error);
        process.exitCode = 1;
      }
    });

  // Get system template
  email
    .command("get-template <id>")
    .description("Get a system email template by ID")
    .action(async function(this: Command, id: string) {
      try {
        const opts = this.optsWithGlobals<PlatformCommandOptions>();
        const client = await clientFactory.createPlatformClient(opts);
        const template = await client.emailTemplates.getSystemTemplate(id);
        renderData(template, getOutputMode(opts));
      } catch (error) {
        handleCommandError(error);
        process.exitCode = 1;
      }
    });

  // Update system template
  email
    .command("update-template <id>")
    .description("Update a system email template")
    .option("--json <json>", "Template data as JSON string")
    .option("--file <path>", "Path to JSON file with template data (use '-' for stdin)")
    .action(async function(this: Command, id: string, cmdOpts) {
      try {
        const data = await readJsonInput(cmdOpts);

        const opts = this.optsWithGlobals<PlatformCommandOptions>();
        const client = await clientFactory.createPlatformClient(opts);
        const template = await client.emailTemplates.updateSystemTemplate(id, data);
        console.log(`✓ Updated system template: ${id}`);
        renderData(template, getOutputMode(opts));
      } catch (error) {
        handleCommandError(error);
        process.exitCode = 1;
      }
    });

  // Test system template
  email
    .command("test-template <id> <email>")
    .description("Send a test email using a system template")
    .action(async function(this: Command, id: string, recipient: string) {
      try {
        const opts = this.optsWithGlobals<PlatformCommandOptions>();
        const client = await clientFactory.createPlatformClient(opts);
        const result = await client.emailTemplates.sendSystemTemplateTest(id, recipient);
        console.log(`✓ ${result.message}`);
        console.log(`  Recipient: ${recipient}`);
      } catch (error) {
        handleCommandError(error);
        process.exitCode = 1;
      }
    });

  // Test SMTP
  email
    .command("test-smtp <email>")
    .description("Test SMTP configuration by sending a test email")
    .action(async function(this: Command, recipient: string) {
      try {
        const opts = this.optsWithGlobals<PlatformCommandOptions>();
        const client = await clientFactory.createPlatformClient(opts);
        const result = await client.emailTemplates.testSmtp(recipient);
        console.log(`✓ ${result.message}`);
        console.log(`  Recipient: ${recipient}`);
      } catch (error) {
        handleCommandError(error);
        process.exitCode = 1;
      }
    });
}
