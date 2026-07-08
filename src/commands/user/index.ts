/**
 * User Commands - Self-service user management
 */

import { Command } from 'commander';
import { registerProfileCommands } from './profile.js';
import { registerTokenCommands } from './tokens.js';
import { registerPasswordCommands } from './password.js';

export function createUserCommand(): Command {
  const user = new Command('user')
    .description('User self-service commands');

  registerProfileCommands(user);
  registerTokenCommands(user);
  registerPasswordCommands(user);

  return user;
}
