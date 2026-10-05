/**
 * API Token Commands
 */

import { Command } from 'commander';
import { clientFactory } from '../../shared/clients.js';
import { renderList, renderData } from '../../output.js';
import { getOutputMode } from '../../shared/types.js';
import { handleCommandError } from '../../shared/error-handler.js';
import { addDataOptions, readJsonInput } from '../../shared/json-input.js';
import { say, emitDeleted } from '../../shared/io.js';
import type { PlatformCommandOptions } from '../../shared/types.js';

export function registerTokenCommands(parent: Command): void {
  const tokens = parent
    .command('tokens')
    .description('Personal API token management');

  tokens
    .command('list')
    .description('List personal API tokens')
    .action(async () => {
      try {
        const opts = parent.optsWithGlobals<PlatformCommandOptions>();
        const client = await clientFactory.createPlatformClient(opts);
        const tokenList = await client.user.listApiTokens();
        const columns = {
          id: 'id',
          name: 'name',
          description: 'description',
          createdAt: 'createdAt',
          lastUsedAt: 'lastUsedAt',
          expiresAt: 'expiresAt',
        } as any;
        renderList(tokenList as any, columns, getOutputMode(opts));
      } catch (error) {
        handleCommandError(error);
      }
    });

  tokens
    .command('create')
    .description('Create a new API token')
    .requiredOption('-n, --name <name>', 'Token name')
    .option('-d, --description <description>', 'Token description')
    .option('-e, --expires <date>', 'Expiration date (ISO 8601)')
    .action(async (options) => {
      try {
        const opts = parent.optsWithGlobals<PlatformCommandOptions>();
        const client = await clientFactory.createPlatformClient(opts);

        const data = {
          name: options.name,
          description: options.description,
          integrationId: options.name,
        };

        const token = await client.user.createApiToken(data);
        say('⚠️  IMPORTANT: Save this token now - it will not be shown again!');
        renderData(token, getOutputMode(opts));
      } catch (error) {
        handleCommandError(error);
      }
    });

  tokens
    .command('get <token-id>')
    .description('Get a personal API token by ID')
    .action(async function(this: Command, tokenId: string) {
      try {
        const opts = parent.optsWithGlobals<PlatformCommandOptions>();
        const client = await clientFactory.createPlatformClient(opts);
        const token = await client.user.getApiToken(tokenId);
        renderData(token, getOutputMode(opts));
      } catch (error) {
        handleCommandError(error);
        process.exitCode = 1;
      }
    });

  addDataOptions(tokens
    .command('update <token-id>')
    .description('Update a personal API token'), 'token data')
    .action(async function(this: Command, tokenId: string, cmdOpts) {
      try {
        const data = await readJsonInput(cmdOpts);

        const opts = parent.optsWithGlobals<PlatformCommandOptions>();
        const client = await clientFactory.createPlatformClient(opts);
        const token = await client.user.updateApiToken(tokenId, data);
        say(`✓ Updated API token: ${tokenId}`);
        renderData(token, getOutputMode(opts));
      } catch (error) {
        handleCommandError(error);
        process.exitCode = 1;
      }
    });

  tokens
    .command('revoke')
    .description('Revoke an API token')
    .argument('<token-id>', 'Token ID to revoke')
    .action(async (tokenId) => {
      try {
        const opts = parent.optsWithGlobals<PlatformCommandOptions>();
        const client = await clientFactory.createPlatformClient(opts);
        await client.user.revokeApiToken(tokenId);
        emitDeleted(tokenId, getOutputMode(opts), `Token ${tokenId} revoked successfully`);
      } catch (error) {
        handleCommandError(error);
      }
    });

  tokens
    .command('rotate')
    .description('Rotate an API token (revoke old, create new)')
    .argument('<token-id>', 'Token ID to rotate')
    .action(async (tokenId) => {
      try {
        const opts = parent.optsWithGlobals<PlatformCommandOptions>();
        const client = await clientFactory.createPlatformClient(opts);
        const token = await client.user.rotateApiToken(tokenId);
        say('⚠️  IMPORTANT: Save this token now - it will not be shown again!');
        renderData(token, getOutputMode(opts));
      } catch (error) {
        handleCommandError(error);
      }
    });

  tokens
    .command('delete')
    .description('Delete an API token')
    .argument('<token-id>', 'Token ID to delete')
    .action(async (tokenId) => {
      try {
        const opts = parent.optsWithGlobals<PlatformCommandOptions>();
        const client = await clientFactory.createPlatformClient(opts);
        await client.user.deleteApiToken(tokenId);
        emitDeleted(tokenId, getOutputMode(opts), `Token ${tokenId} deleted successfully`);
      } catch (error) {
        handleCommandError(error);
      }
    });
}
