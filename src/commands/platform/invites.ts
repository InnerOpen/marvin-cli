/**
 * Platform Invites Commands
 *
 * Manage workspace invitation tokens
 */

import { Command } from 'commander';
import { clientFactory } from '../../shared/clients.js';
import { renderList, renderData } from '../../output.js';
import { getOutputMode, type PlatformCommandOptions } from '../../shared/types.js';
import { formatTokenForOutput, displayTokenWarning } from '../../shared/security.js';
import { requireValidEmail } from '../../shared/validation.js';
import { TABLE_SCHEMAS } from '../../shared/table-schemas.js';
import { addPageOptions, fetchPages } from '../../shared/pagination.js';
import { say, emitDeleted } from '../../shared/io.js';

export function registerInviteCommands(parent: Command): void {
  const invites = parent
    .command('invites')
    .description('Manage workspace invitation tokens');

  // List invite tokens
  addPageOptions(invites
    .command('list')
    .description('List invitation tokens for the current workspace (one page; --all for every page)'))
    .action(async (options, command: Command) => {
      try {
        const opts = command.optsWithGlobals<PlatformCommandOptions>();
        const mode = getOutputMode(opts);
        const sdk = await clientFactory.createPlatformClient(opts);

        const tokens = await fetchPages<any>(sdk, '/api/groups/invitations', options);

        if (!tokens || tokens.length === 0) {
          if (mode === 'table') {
            say('No invitation tokens found');
          } else {
            renderList([] as any[], {}, mode);
          }
          return;
        }

        const rows = tokens.map((token: any) => ({
          'Token': token.token?.substring(0, 20) + '...',
          'Role': token.workspaceRole || 'EDITOR',
          'Uses Left': token.usesLeft,
          'Created': (token.createdAt || token.created_at) ? new Date(token.createdAt || token.created_at).toLocaleDateString() : 'Unknown',
        }));

        renderList(rows as any[], TABLE_SCHEMAS['invites.list'], mode);
        if (mode === 'table') {
          say(`\nTotal: ${tokens.length} invitation token(s)`);
        }
      } catch (error) {
        console.error('Failed to list invitation tokens:', error);
        process.exitCode = 1;
        return;
      }
    });

  // Create and optionally send invitation
  invites
    .command('invite')
    .description('Create an invitation and optionally send via email')
    .option('--email <email>', 'Email address to send invitation to')
    .option('--uses <number>', 'Number of uses allowed', '1')
    .option('--role <role>', 'Workspace role for invited users (VIEWER, AUTHOR, EDITOR, ADMIN, OWNER)', 'EDITOR')
    .action(async (options, command: Command) => {
      try {
        const opts = command.optsWithGlobals<PlatformCommandOptions>();
        const mode = getOutputMode(opts);
        const sdk = await clientFactory.createPlatformClient(opts);

        // Create a token
        const token = await sdk.invites.create({
          usesLeft: parseInt(options.uses),
          workspaceRole: options.role,
        });

        const inviteUrl = sdk.invites.getInvitationUrl(token.token!);

        // If email provided, validate and send it
        if (options.email) {
          requireValidEmail(options.email);

          const result = await sdk.invites.sendEmail({
            email: options.email,
            token: token.token!,
          });

          if (mode !== 'table') {
            renderData({
              token: formatTokenForOutput(token.token!),
              inviteUrl,
              email: options.email,
              emailSent: result.success,
              error: result.error,
            }, mode);
          } else {
            if (result.success) {
              say(`✓ Invitation email sent to ${options.email}`);
            } else {
              say(`⚠ Email failed: ${result.error}`);
              say('\nYou can still share the link manually:');
            }
            displayTokenWarning();
            say(`\nInvitation URL:`);
            // The URL is the data: stdout, so `URL=$(marvin platform invites invite)` works
            process.stdout.write(`${inviteUrl}\n`);
            say(`Token: ${formatTokenForOutput(token.token!)}`);
          }
        } else {
          // No email, just show the link
          if (mode !== 'table') {
            renderData({
              token: formatTokenForOutput(token.token!),
              inviteUrl,
              usesLeft: token.usesLeft,
              workspaceRole: token.workspaceRole,
            }, mode);
          } else {
            displayTokenWarning();
            say('✓ Invitation created');
            say(`\nInvitation URL:`);
            process.stdout.write(`${inviteUrl}\n`);
            say(`\nToken: ${formatTokenForOutput(token.token!)}`);
            say(`Workspace Role: ${token.workspaceRole || 'EDITOR'}`);
            say(`Uses remaining: ${token.usesLeft}`);
          }
        }
      } catch (error) {
        console.error('Failed to create invitation:', error);
        process.exitCode = 1;
        return;
      }
    });

  // Generate link from token
  invites
    .command('link')
    .description('Generate an invitation link from a token')
    .requiredOption('--token <token>', 'Invitation token')
    .action(async (options, command: Command) => {
      try {
        const opts = command.optsWithGlobals<PlatformCommandOptions>();
        const mode = getOutputMode(opts);
        const sdk = await clientFactory.createPlatformClient(opts);
        const inviteUrl = sdk.invites.getInvitationUrl(options.token);

        if (mode !== 'table') {
          renderData({ inviteUrl }, mode);
        } else {
          say('Invitation URL:');
          process.stdout.write(`${inviteUrl}\n`);
        }
      } catch (error) {
        console.error('Failed to generate link:', error);
        process.exitCode = 1;
        return;
      }
    });

  // Revoke invitation
  invites
    .command('revoke')
    .description('Revoke an invitation token')
    .requiredOption('--id <id>', 'Invitation token ID')
    .option('--yes', 'Skip confirmation')
    .action(async (options, command: Command) => {
      try {
        if (!options.yes) {
          const readline = await import('readline/promises');
          const rl = readline.createInterface({
            input: process.stdin,
            output: process.stderr,
          });

          const answer = await rl.question('Revoke this invitation? The link will stop working. (y/N) ');
          rl.close();

          if (answer.toLowerCase() !== 'y') {
            say('Cancelled');
            return;
          }
        }

        const opts = command.optsWithGlobals<PlatformCommandOptions>();
        const sdk = await clientFactory.createPlatformClient(opts);
        await sdk.invites.delete(options.id);

        emitDeleted(options.id, getOutputMode(opts), '✓ Invitation revoked');
      } catch (error) {
        console.error('Failed to revoke invitation:', error);
        process.exitCode = 1;
        return;
      }
    });
}
