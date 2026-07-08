/**
 * User Profile Commands
 */

import { Command } from 'commander';
import { clientFactory } from '../../shared/clients.js';
import { renderData } from '../../output.js';
import type { PlatformCommandOptions } from '../../shared/types.js';

export function registerProfileCommands(parent: Command): void {
  const profile = parent
    .command('profile')
    .description('User profile management');

  profile
    .command('show')
    .description('Show current user profile')
    .action(async () => {
      const client = await clientFactory.createPlatformClient(parent.optsWithGlobals<PlatformCommandOptions>());
      const userProfile = await client.user.getProfile();
      renderData(userProfile, (parent.optsWithGlobals<PlatformCommandOptions>().output || 'table') as any);
    });
}
