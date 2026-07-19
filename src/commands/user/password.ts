/**
 * Password Management Commands
 */

import { Command } from 'commander';
import { clientFactory } from '../../shared/clients.js';
import type { PlatformCommandOptions } from '../../shared/types.js';
import { promptSecure } from '../../shared/prompt.js';
import { handleCommandError } from '../../shared/error-handler.js';

export function registerPasswordCommands(parent: Command): void {
  parent
    .command('change-password')
    .description('Change your password (prompts securely, no shell history exposure)')
    .action(async () => {
      try {
        // Prompt for passwords securely (hidden input, no shell history)
        const currentPassword = await promptSecure('Enter current password (input hidden):');

        if (!currentPassword) {
          console.error('Error: Current password is required');
          process.exitCode = 1;
          return;
        }

        const newPassword = await promptSecure('Enter new password (input hidden):');

        if (!newPassword) {
          console.error('Error: New password is required');
          process.exitCode = 1;
          return;
        }

        const confirmPassword = await promptSecure('Confirm new password (input hidden):');

        if (newPassword !== confirmPassword) {
          console.error('Error: Passwords do not match');
          process.exitCode = 1;
          return;
        }

        const client = await clientFactory.createPlatformClient(parent.optsWithGlobals<PlatformCommandOptions>());

        const data = {
          currentPassword,
          newPassword,
        };

        await client.user.changePassword(data);
        console.log('✓ Password changed successfully');
      } catch (error) {
        handleCommandError(error);
      }
    });
}
