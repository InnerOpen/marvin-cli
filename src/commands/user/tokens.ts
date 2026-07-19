/**
 * API Token Commands
 */

import { Command } from 'commander';
import { clientFactory } from '../../shared/clients.js';
import { renderList, renderData } from '../../output.js';
import { getOutputMode } from '../../shared/types.js';
import { handleCommandError } from '../../shared/error-handler.js';
import { readJsonInput } from '../../shared/json-input.js';
import type { PlatformCommandOptions } from '../../shared/types.js';

export function registerTokenCommands(parent: Command): void {
  const tokens = parent
    .command('tokens')
    .description('Personal API token management');

  tokens
    .command('list')
    .description('List personal API tokens')
    .action(async () => {
      const client = await clientFactory.createPlatformClient(parent.optsWithGlobals<PlatformCommandOptions>());
      const tokenList = await client.user.listApiTokens();
      const columns = {
        id: 'id',
        name: 'name',
        description: 'description',
        createdAt: 'createdAt',
        lastUsedAt: 'lastUsedAt',
        expiresAt: 'expiresAt',
      } as any;
      renderList(tokenList as any, columns, (parent.optsWithGlobals<PlatformCommandOptions>().output as any) || 'table');
    });

  tokens
    .command('create')
    .description('Create a new API token')
    .requiredOption('-n, --name <name>', 'Token name')
    .option('-d, --description <description>', 'Token description')
    .option('-e, --expires <date>', 'Expiration date (ISO 8601)')
    .action(async (options) => {
      const client = await clientFactory.createPlatformClient(parent.optsWithGlobals<PlatformCommandOptions>());

      const data = {
        name: options.name,
        description: options.description,
        integrationId: options.name,
      };

      const token = await client.user.createApiToken(data);
      console.log('\n⚠️  IMPORTANT: Save this token now - it will not be shown again!\n');
      renderData(token, (parent.optsWithGlobals<PlatformCommandOptions>().output || 'table') as any);
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

  tokens
    .command('update <token-id>')
    .description('Update a personal API token')
    .option('--json <json>', 'Token data as JSON string')
    .option('--file <path>', "Path to JSON file with token data (use '-' for stdin)")
    .action(async function(this: Command, tokenId: string, cmdOpts) {
      try {
        const data = await readJsonInput(cmdOpts);

        const opts = parent.optsWithGlobals<PlatformCommandOptions>();
        const client = await clientFactory.createPlatformClient(opts);
        const token = await client.user.updateApiToken(tokenId, data);
        console.log(`✓ Updated API token: ${tokenId}`);
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
      const client = await clientFactory.createPlatformClient(parent.optsWithGlobals<PlatformCommandOptions>());
      await client.user.revokeApiToken(tokenId);
      console.log(`Token ${tokenId} revoked successfully`);
    });

  tokens
    .command('rotate')
    .description('Rotate an API token (revoke old, create new)')
    .argument('<token-id>', 'Token ID to rotate')
    .action(async (tokenId) => {
      const client = await clientFactory.createPlatformClient(parent.optsWithGlobals<PlatformCommandOptions>());
      const token = await client.user.rotateApiToken(tokenId);
      console.log('\n⚠️  IMPORTANT: Save this token now - it will not be shown again!\n');
      renderData(token, (parent.optsWithGlobals<PlatformCommandOptions>().output || 'table') as any);
    });

  tokens
    .command('delete')
    .description('Delete an API token')
    .argument('<token-id>', 'Token ID to delete')
    .action(async (tokenId) => {
      const client = await clientFactory.createPlatformClient(parent.optsWithGlobals<PlatformCommandOptions>());
      await client.user.deleteApiToken(tokenId);
      console.log(`Token ${tokenId} deleted successfully`);
    });
}
