/**
 * Platform Invites Commands
 *
 * Manage workspace invitation tokens
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { getSdk } from '../../shared/sdk.js';
import { formatJson, formatTable } from '../../shared/formatters.js';
import { handleError } from '../../shared/error-handler.js';

export function createInvitesCommand(): Command {
  const invites = new Command('invites')
    .description('Manage workspace invitation tokens');

  // List invite tokens
  invites
    .command('list')
    .description('List all invitation tokens for the current workspace')
    .option('--json', 'Output as JSON')
    .action(async (options) => {
      try {
        const sdk = getSdk();
        const tokens = await sdk.invites.list();

        if (options.json) {
          console.log(formatJson(tokens));
        } else {
          if (tokens.length === 0) {
            console.log(chalk.dim('No invitation tokens found'));
            return;
          }

          const rows = tokens.map(token => ({
            'Token': token.token?.substring(0, 20) + '...',
            'Uses Left': token.usesLeft,
            'Created': token.createdAt ? new Date(token.createdAt).toLocaleDateString() : 'Unknown',
          }));

          console.log(formatTable(rows));
          console.log(chalk.dim(`\nTotal: ${tokens.length} invitation token(s)`));
        }
      } catch (error) {
        handleError(error, 'Failed to list invitation tokens');
      }
    });

  // Create invite token
  invites
    .command('create')
    .description('Create a new invitation token')
    .option('--uses <number>', 'Number of uses allowed', '1')
    .option('--json', 'Output as JSON')
    .action(async (options) => {
      try {
        const sdk = getSdk();
        const token = await sdk.invites.create({
          usesLeft: parseInt(options.uses),
        });

        if (options.json) {
          console.log(formatJson(token));
        } else {
          console.log(chalk.green('✓ Invitation token created'));
          console.log(chalk.dim('Token:'), chalk.cyan(token.token));
          console.log(chalk.dim('Uses remaining:'), token.usesLeft);

          // Show the invitation URL
          const inviteUrl = `${process.env.MARVIN_API_URL || 'http://localhost:8080'}/register?token=${token.token}`;
          console.log(chalk.dim('\nInvitation URL:'));
          console.log(chalk.cyan(inviteUrl));
        }
      } catch (error) {
        handleError(error, 'Failed to create invitation token');
      }
    });

  // Invite command (create token and optionally send email)
  invites
    .command('invite')
    .description('Create an invitation and optionally send via email')
    .option('--email <email>', 'Email address to send invitation to')
    .option('--uses <number>', 'Number of uses allowed', '1')
    .option('--json', 'Output as JSON')
    .action(async (options) => {
      try {
        const sdk = getSdk();

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

          if (options.json) {
            console.log(formatJson({
              token: token.token,
              inviteUrl,
              email: options.email,
              emailSent: result.success,
              error: result.error,
            }));
          } else {
            if (result.success) {
              console.log(chalk.green('✓ Invitation email sent to'), chalk.cyan(options.email));
            } else {
              console.log(chalk.yellow('⚠ Email failed:'), result.error);
              console.log(chalk.dim('\nYou can still share the link manually:'));
            }
            console.log(chalk.dim('\nInvitation URL:'));
            console.log(chalk.cyan(inviteUrl));
            console.log(chalk.dim('Token:'), chalk.cyan(token.token));
          }
        } else {
          // No email, just show the link
          if (options.json) {
            console.log(formatJson({
              token: token.token,
              inviteUrl,
              usesLeft: token.usesLeft,
            }));
          } else {
            console.log(chalk.green('✓ Invitation created'));
            console.log(chalk.dim('\nInvitation URL:'));
            console.log(chalk.cyan(inviteUrl));
            console.log(chalk.dim('\nToken:'), chalk.cyan(token.token));
            console.log(chalk.dim('Uses remaining:'), token.usesLeft);
          }
        }
      } catch (error) {
        handleError(error, 'Failed to create invitation');
      }
    });

  // Get invitation link
  invites
    .command('link')
    .description('Generate an invitation link from a token')
    .requiredOption('--token <token>', 'Invitation token')
    .action(async (options) => {
      const sdk = getSdk();
      const inviteUrl = sdk.invites.getInvitationUrl(options.token);

      console.log(chalk.dim('Invitation URL:'));
      console.log(chalk.cyan(inviteUrl));
    });

  // Revoke/delete invitation
  invites
    .command('revoke')
    .description('Revoke an invitation token')
    .requiredOption('--id <id>', 'Invitation token ID')
    .option('--yes', 'Skip confirmation')
    .action(async (options) => {
      try {
        if (!options.yes) {
          const readline = await import('readline/promises');
          const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
          });

          const answer = await rl.question(chalk.yellow('Revoke this invitation? The link will stop working. (y/N) '));
          rl.close();

          if (answer.toLowerCase() !== 'y') {
            console.log(chalk.dim('Cancelled'));
            return;
          }
        }

        const sdk = getSdk();
        await sdk.invites.delete(options.id);

        console.log(chalk.green('✓ Invitation revoked'));
      } catch (error) {
        handleError(error, 'Failed to revoke invitation');
      }
    });

  return invites;
}
