/**
 * Email Templates Commands
 */

import { Command } from 'commander';
import { clientFactory } from '../../shared/clients.js';
import type { PlatformCommandOptions } from '../../shared/types.js';
import { renderList, renderData } from '../../output.js';

export function registerEmailTemplateCommands(parent: Command): void {
  const cmd = new Command('email-templates')
    .alias('templates')
    .description('Manage workspace email templates');

  parent.addCommand(cmd);

  // List templates
  cmd
    .command('list')
    .alias('ls')
    .description('List email templates')
    .action(async function(this: Command) {
      try {
        const client = await clientFactory.createPlatformClient(parent.optsWithGlobals<PlatformCommandOptions>());
        const workspace = await client.workspaces.getCurrent();
        const templates = await client.emailTemplates.list(workspace.id);

        const globalOpts = parent.optsWithGlobals<PlatformCommandOptions>();
        renderList(templates as any, {
          name: 'name',
          template_type: 'type',
          enabled: 'enabled',
          group_id: 'scope',
        } as any, globalOpts.output as any || 'table');
      } catch (error) {
        console.error(error instanceof Error ? error.message : error);
        process.exitCode = 1;
        return;
      }
    });

  // Get template
  cmd
    .command('get <template-id>')
    .description('Get email template details')
    .action(async function(this: Command, templateId: string) {
      try {
        const client = await clientFactory.createPlatformClient(parent.optsWithGlobals<PlatformCommandOptions>());
        const workspace = await client.workspaces.getCurrent();
        const template = await client.emailTemplates.get(workspace.id, templateId);

        const globalOpts = parent.optsWithGlobals<PlatformCommandOptions>();
        renderData(template as any, globalOpts.output as any || 'table');
      } catch (error) {
        console.error(error instanceof Error ? error.message : error);
        process.exitCode = 1;
        return;
      }
    });

  // Create template
  cmd
    .command('create')
    .description('Create a new email template')
    .requiredOption('--type <type>', 'Template type (e.g., welcome, notification)')
    .requiredOption('--name <name>', 'Template name')
    .requiredOption('--subject <subject>', 'Email subject')
    .option('--description <desc>', 'Template description')
    .option('--header <text>', 'Header text (structured mode)')
    .option('--message-top <text>', 'Message top (structured mode)')
    .option('--message-bottom <text>', 'Message bottom (structured mode)')
    .option('--button-text <text>', 'Button text (structured mode)')
    .option('--custom-html <html>', 'Custom HTML template (overrides structured fields)')
    .option('--disabled', 'Create as disabled', false)
    .action(async function(this: Command, options: any) {
      try {
        const client = await clientFactory.createPlatformClient(parent.optsWithGlobals<PlatformCommandOptions>());
        const workspace = await client.workspaces.getCurrent();

        const data = {
          template_type: options.type,
          name: options.name,
          subject: options.subject,
          description: options.description,
          header_text: options.header,
          message_top: options.messageTop,
          message_bottom: options.messageBottom,
          button_text: options.buttonText,
          custom_html: options.customHtml,
          enabled: !options.disabled,
        };

        const template = await client.emailTemplates.create(workspace.id, data);

        const globalOpts = parent.optsWithGlobals<PlatformCommandOptions>();
        renderData(template as any, globalOpts.output as any || 'table');
        console.log(`✓ Created email template: ${template.name}`);
      } catch (error) {
        console.error(error instanceof Error ? error.message : error);
        process.exitCode = 1;
        return;
      }
    });

  // Update template
  cmd
    .command('update <template-id>')
    .description('Update an email template')
    .option('--name <name>', 'Template name')
    .option('--subject <subject>', 'Email subject')
    .option('--description <desc>', 'Template description')
    .option('--header <text>', 'Header text')
    .option('--message-top <text>', 'Message top')
    .option('--message-bottom <text>', 'Message bottom')
    .option('--button-text <text>', 'Button text')
    .option('--custom-html <html>', 'Custom HTML template')
    .option('--enable', 'Enable the template')
    .option('--disable', 'Disable the template')
    .action(async function(this: Command, templateId: string, options: any) {
      try {
        const client = await clientFactory.createPlatformClient(parent.optsWithGlobals<PlatformCommandOptions>());
        const workspace = await client.workspaces.getCurrent();

        const data: any = {};
        if (options.name) data.name = options.name;
        if (options.subject) data.subject = options.subject;
        if (options.description) data.description = options.description;
        if (options.header) data.header_text = options.header;
        if (options.messageTop) data.message_top = options.messageTop;
        if (options.messageBottom) data.message_bottom = options.messageBottom;
        if (options.buttonText) data.button_text = options.buttonText;
        if (options.customHtml) data.custom_html = options.customHtml;
        if (options.enable) data.enabled = true;
        if (options.disable) data.enabled = false;

        const template = await client.emailTemplates.update(workspace.id, templateId, data);

        const globalOpts = parent.optsWithGlobals<PlatformCommandOptions>();
        renderData(template as any, globalOpts.output as any || 'table');
        console.log(`✓ Updated email template: ${template.name}`);
      } catch (error) {
        console.error(error instanceof Error ? error.message : error);
        process.exitCode = 1;
        return;
      }
    });

  // Delete template
  cmd
    .command('delete <template-id>')
    .alias('rm')
    .description('Delete an email template')
    .option('--yes', 'Skip confirmation', false)
    .action(async function(this: Command, templateId: string, options: any) {
      try {
        const client = await clientFactory.createPlatformClient(parent.optsWithGlobals<PlatformCommandOptions>());
        const workspace = await client.workspaces.getCurrent();

        if (!options.yes) {
          console.log('Delete template? Use --yes to confirm');
          process.exitCode = 1;
        return;
        }

        await client.emailTemplates.delete(workspace.id, templateId);
        console.log(`✓ Deleted template: ${templateId}`);
      } catch (error) {
        console.error(error instanceof Error ? error.message : error);
        process.exitCode = 1;
        return;
      }
    });

  // Test send
  cmd
    .command('test-send <template-id> <email>')
    .alias('test')
    .description('Send a test email using a template')
    .action(async function(this: Command, templateId: string, email: string) {
      try {
        const client = await clientFactory.createPlatformClient(parent.optsWithGlobals<PlatformCommandOptions>());
        const workspace = await client.workspaces.getCurrent();
        const result = await client.emailTemplates.sendTest(workspace.id, templateId, email);
        console.log(`✓ ${result.message}`);
        console.log(`  Recipient: ${email}`);
      } catch (error) {
        console.error(error instanceof Error ? error.message : error);
        process.exitCode = 1;
        return;
      }
    });
}
