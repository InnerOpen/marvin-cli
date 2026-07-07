/**
 * Password Management Commands
 */

import { Command } from 'commander';
import { clientFactory } from '../../shared/clients.js';
import type { PlatformCommandOptions } from '../../shared/types.js';

export function registerPasswordCommands(parent: Command): void {
  parent
    .command('change-password')
    .description('Change your password')
    .requiredOption('-c, --current <password>', 'Current password')
    .requiredOption('-n, --new <password>', 'New password')
    .action(async (options) => {
      const client = await clientFactory.createPlatformClient(parent.optsWithGlobals<PlatformCommandOptions>());

      const data = {
        currentPassword: options.current,
        newPassword: options.new,
      };

      await client.user.changePassword(data);
      console.log('Password changed successfully');
    });
}
