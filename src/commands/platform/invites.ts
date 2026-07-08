/**
 * Platform Invites Commands
 *
 * Manage workspace invitation tokens
 */

import { Command } from 'commander';
import { clientFactory } from '../../shared/clients.js';
import { renderList, renderData } from '../../output.js';
import { getOutputMode, type PlatformCommandOptions } from '../../shared/types.js';

export function registerInviteCommands(parent: Command): void {
  const invites = parent
    .command('invites')
    .description('Manage workspace invitation tokens');

  // List invite tokens
  invites
    .command('list')
    .description('List all invitation tokens for the current workspace')
    .action(async (_options, command: Command) => {
      try {
        const opts = command.optsWithGlobals<PlatformCommandOptions>();
        const mode = getOutputMode(opts);
        const sdk = await clientFactory.createPlatformClient(opts);

        const tokens = await sdk.invites.list();

        if (!tokens || tokens.length === 0) {
          console.log('No invitation tokens found');
          return;
        }

        const rows = tokens.map((token: any) => ({
          'Token': token.token?.substring(0, 20) + '...',
          'Uses Left': token.usesLeft,
          'Created': token.createdAt ? new Date(token.createdAt).toLocaleDateString() : 'Unknown',
        }));

        const columns = {
          'Token': (row: any) => row['Token'],
          'Uses Left': (row: any) => row['Uses Left'],
          'Created': (row: any) => row['Created'],
        };
        renderList(rows as any[], columns, mode);
        console.log(`\nTotal: ${tokens.length} invitation token(s)`);
      } catch (error) {
        console.error('Failed to list invitation tokens:', error);
        process.exit(1);
      }
    });

  // Create and optionally send invitation
  invites
    .command('invite')
    .description('Create an invitation and optionally send via email')
    .option('--email <email>', 'Email address to send invitation to')
    .option('--uses <number>', 'Number of uses allowed', '1')
    .action(async (options, command: Command) => {
      try {
        const opts = command.optsWithGlobals<PlatformCommandOptions>();
        const mode = getOutputMode(opts);
        const sdk = await clientFactory.createPlatformClient(opts);

        // Create a token
        const token = await sdk.invites.create({
          usesLeft: parseInt(options.uses),
        });

        const inviteUrl = sdk.invites.getInvitationUrl(token.token!);

        // If email provided, send it
        if (options.email) {
          const result = await sdk.invites.sendEmail({
            email: options.email,
            token: token.token!,
          });

          if (mode === 'json') {
            console.log(JSON.stringify({
              token: token.token,
              inviteUrl,
              email: options.email,
              emailSent: result.success,
              error: result.error,
            }, null, 2));
          } else {
            if (result.success) {
              console.log(`✓ Invitation email sent to ${options.email}`);
            } else {
              console.log(`⚠ Email failed: ${result.error}`);
              console.log('\nYou can still share the link manually:');
            }
            console.log(`\nInvitation URL:`);
            console.log(inviteUrl);
            console.log(`Token: ${token.token}`);
          }
        } else {
          // No email, just show the link
          if (mode === 'json') {
            console.log(JSON.stringify({
              token: token.token,
              inviteUrl,
              usesLeft: token.usesLeft,
            }, null, 2));
          } else {
            console.log('✓ Invitation created');
            console.log(`\nInvitation URL:`);
            console.log(inviteUrl);
            console.log(`\nToken: ${token.token}`);
            console.log(`Uses remaining: ${token.usesLeft}`);
          }
        }
      } catch (error) {
        console.error('Failed to create invitation:', error);
        process.exit(1);
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
        const sdk = await clientFactory.createPlatformClient(opts);
        const inviteUrl = sdk.invites.getInvitationUrl(options.token);

        console.log('Invitation URL:');
        console.log(inviteUrl);
      } catch (error) {
        console.error('Failed to generate link:', error);
        process.exit(1);
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
            output: process.stdout,
          });

          const answer = await rl.question('Revoke this invitation? The link will stop working. (y/N) ');
          rl.close();

          if (answer.toLowerCase() !== 'y') {
            console.log('Cancelled');
            return;
          }
        }

        const opts = command.optsWithGlobals<PlatformCommandOptions>();
        const sdk = await clientFactory.createPlatformClient(opts);
        await sdk.invites.delete(options.id);

        console.log('✓ Invitation revoked');
      } catch (error) {
        console.error('Failed to revoke invitation:', error);
        process.exit(1);
      }
    });
}
