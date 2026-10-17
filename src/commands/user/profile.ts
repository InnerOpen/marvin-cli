/**
 * User Profile Commands
 */

import { Command } from 'commander';
import type { UserProfileUpdate } from '@inneropen/marvin-sdk/platform';
import { clientFactory } from '../../shared/clients.js';
import { renderData } from '../../output.js';
import { getOutputMode, type PlatformCommandOptions } from '../../shared/types.js';
import { handleCommandError } from '../../shared/error-handler.js';
import { emitOk } from '../../shared/io.js';

export function registerProfileCommands(parent: Command): void {
  const profile = parent
    .command('profile')
    .description('User profile management');

  profile
    .command('show')
    .description('Show current user profile')
    .action(async function(this: Command) {
      try {
        const opts = this.optsWithGlobals<PlatformCommandOptions>();
        const client = await clientFactory.createPlatformClient(opts);
        const userProfile = await client.user.getProfile();
        renderData(userProfile, getOutputMode(opts));
      } catch (error) {
        handleCommandError(error);
      }
    });

  profile
    .command('update')
    .description('Update current user profile')
    .option('--full-name <name>', 'New display name')
    .option('--name <name>', 'Alias for --full-name')
    .option('--username <username>', 'New username')
    .option('--email <email>', 'New email address')
    .action(async function(this: Command, cmdOpts) {
      try {
        // The API's UserProfileUpdate takes fullName / username / email
        const data: UserProfileUpdate = {};
        const fullName = cmdOpts.fullName ?? cmdOpts.name;
        if (fullName) data.fullName = fullName;
        if (cmdOpts.username) data.username = cmdOpts.username;
        if (cmdOpts.email) data.email = cmdOpts.email;
        if (Object.keys(data).length === 0) {
          console.error('Error: Provide at least one of --full-name, --username or --email');
          process.exitCode = 1;
          return;
        }
        const opts = this.optsWithGlobals<PlatformCommandOptions>();
        const client = await clientFactory.createPlatformClient(opts);
        await client.user.updateProfile(data);
        emitOk({ updated: data }, getOutputMode(opts), '✓ Profile updated');
      } catch (error) {
        handleCommandError(error);
      }
    });
}
