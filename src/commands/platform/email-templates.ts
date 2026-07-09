/**
 * Email Templates Commands
 */

import { Command } from 'commander';
import { formatTable, requireWorkspace, getSDK, formatJson, formatYaml, formatCsv } from '../../lib/utils.js';
import type { OutputFormat } from '../../lib/utils.js';

export function createEmailTemplatesCommand() {
  const cmd = new Command('email-templates')
    .alias('templates')
    .description('Manage workspace email templates');

  // List templates
  cmd
    .command('list')
    .alias('ls')
    .description('List email templates')
    .option('--workspace <slug>', 'Workspace slug')
    .option('--output <format>', 'Output format: table, json, yaml, csv', 'table')
    .action(async (options) => {
      const workspace = await requireWorkspace(options.workspace);
      const sdk = await getSDK();
      const format = options.output as OutputFormat;

      const templates = await sdk.emailTemplates.list(workspace.group.id);

      if (format === 'json') {
        console.log(formatJson(templates));
      } else if (format === 'yaml') {
        console.log(formatYaml(templates));
      } else if (format === 'csv') {
        console.log(formatCsv(templates, ['id', 'name', 'template_type', 'enabled', 'group_id']));
      } else {
        const rows = templates.map(t => ({
          Name: t.name,
          Type: t.template_type,
          Enabled: t.enabled ? '✓' : '✗',
          Scope: t.group_id ? 'Workspace' : 'System',
          Created: new Date(t.created_at).toLocaleDateString(),
        }));
        console.log(formatTable(rows));
      }
    });

  // Get template
  cmd
    .command('get <template-id>')
    .description('Get email template details')
    .option('--workspace <slug>', 'Workspace slug')
    .option('--output <format>', 'Output format: table, json, yaml', 'table')
    .action(async (templateId, options) => {
      const workspace = await requireWorkspace(options.workspace);
      const sdk = await getSDK();
      const format = options.output as OutputFormat;

      const template = await sdk.emailTemplates.get(workspace.group.id, templateId);

      if (format === 'json') {
        console.log(formatJson(template));
      } else if (format === 'yaml') {
        console.log(formatYaml(template));
      } else {
        const rows = [
          { Field: 'ID', Value: template.id },
          { Field: 'Name', Value: template.name },
          { Field: 'Type', Value: template.template_type },
          { Field: 'Subject', Value: template.subject },
          { Field: 'Enabled', Value: template.enabled ? 'Yes' : 'No' },
          { Field: 'Scope', Value: template.group_id ? 'Workspace' : 'System' },
          { Field: 'Description', Value: template.description || '(none)' },
        ];
        console.log(formatTable(rows));

        if (template.custom_html) {
          console.log('\n--- Custom HTML ---');
          console.log(template.custom_html.substring(0, 200) + '...');
        } else {
          console.log('\n--- Structured Template ---');
          console.log('Header:', template.header_text || '(none)');
          console.log('Message Top:', template.message_top || '(none)');
          console.log('Button Text:', template.button_text || '(none)');
          console.log('Message Bottom:', template.message_bottom || '(none)');
        }
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
    .option('--workspace <slug>', 'Workspace slug')
    .option('--output <format>', 'Output format: table, json, yaml', 'table')
    .action(async (options) => {
      const workspace = await requireWorkspace(options.workspace);
      const sdk = await getSDK();
      const format = options.output as OutputFormat;

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

      const template = await sdk.emailTemplates.create(workspace.group.id, data);

      if (format === 'json') {
        console.log(formatJson(template));
      } else if (format === 'yaml') {
        console.log(formatYaml(template));
      } else {
        console.log(`✓ Created email template: ${template.name}`);
        console.log(`  ID: ${template.id}`);
        console.log(`  Type: ${template.template_type}`);
        console.log(`  Subject: ${template.subject}`);
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
    .option('--workspace <slug>', 'Workspace slug')
    .option('--output <format>', 'Output format: table, json, yaml', 'table')
    .action(async (templateId, options) => {
      const workspace = await requireWorkspace(options.workspace);
      const sdk = await getSDK();
      const format = options.output as OutputFormat;

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

      const template = await sdk.emailTemplates.update(workspace.group.id, templateId, data);

      if (format === 'json') {
        console.log(formatJson(template));
      } else if (format === 'yaml') {
        console.log(formatYaml(template));
      } else {
        console.log(`✓ Updated email template: ${template.name}`);
        console.log(`  ID: ${template.id}`);
      }
    });

  // Delete template
  cmd
    .command('delete <template-id>')
    .alias('rm')
    .description('Delete an email template')
    .option('--workspace <slug>', 'Workspace slug')
    .option('--yes', 'Skip confirmation', false)
    .action(async (templateId, options) => {
      const workspace = await requireWorkspace(options.workspace);
      const sdk = await getSDK();

      if (!options.yes) {
        const { default: inquirer } = await import('inquirer');
        const { confirm } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'confirm',
            message: 'Are you sure you want to delete this template?',
            default: false,
          },
        ]);
        if (!confirm) {
          console.log('Cancelled');
          return;
        }
      }

      await sdk.emailTemplates.delete(workspace.group.id, templateId);
      console.log(`✓ Deleted template: ${templateId}`);
    });

  // Test send
  cmd
    .command('test-send <template-id> <email>')
    .alias('test')
    .description('Send a test email using a template')
    .option('--workspace <slug>', 'Workspace slug')
    .action(async (templateId, email, options) => {
      const workspace = await requireWorkspace(options.workspace);
      const sdk = await getSDK();

      const result = await sdk.emailTemplates.sendTest(workspace.group.id, templateId, email);
      console.log(`✓ ${result.message}`);
      console.log(`  Recipient: ${email}`);
    });

  return cmd;
}
