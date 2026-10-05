import { Command } from "commander";
import { clientFactory } from "../../shared/clients.js";
import { renderList, renderData } from "../../output.js";
import { getOutputMode, type PlatformCommandOptions } from "../../shared/types.js";
import { addDataOptions, readJsonInput } from "../../shared/json-input.js";
import { say, emitDeleted } from "../../shared/io.js";
import { handleCommandError } from "../../shared/error-handler.js";

export function registerAiProviderCommands(parent: Command): void {
  const providers = parent
    .command("providers")
    .description("AI provider configuration (and nested models)");

  // List providers
  providers
    .command("list")
    .description("List AI providers")
    .action(async function(this: Command) {
      try {
        const opts = this.optsWithGlobals<PlatformCommandOptions>();
        const client = await clientFactory.createPlatformClient(opts);

        const result = await client.ai.providers.list();
        renderList(result as any[], {
          id: 'id',
          name: 'name',
          slug: 'slug',
          providerType: 'providerType',
          enabled: 'enabled',
          isDefault: 'isDefault',
        } as any, getOutputMode(opts));
      } catch (error) {
        handleCommandError(error);
      }
    });

  // Get provider by ID
  providers
    .command("get <id>")
    .description("Get AI provider by ID")
    .action(async function(this: Command, id: string) {
      try {
        const opts = this.optsWithGlobals<PlatformCommandOptions>();
        const client = await clientFactory.createPlatformClient(opts);

        const provider = await client.ai.providers.get(id);
        renderData(provider, getOutputMode(opts));
      } catch (error) {
        handleCommandError(error);
      }
    });

  // Create provider
  addDataOptions(providers
    .command("create")
    .description("Create a new AI provider"), "provider data")
    .action(async function(this: Command, cmdOpts) {
      try {
        const data = await readJsonInput(cmdOpts);

        const opts = this.optsWithGlobals<PlatformCommandOptions>();
        const client = await clientFactory.createPlatformClient(opts);

        const provider = await client.ai.providers.create(data);
        say(`✓ Created AI provider: ${provider.id}`);
        renderData(provider, getOutputMode(opts));
      } catch (error) {
        handleCommandError(error);
      }
    });

  // Update provider
  addDataOptions(providers
    .command("update <id>")
    .description("Update an AI provider"), "provider data")
    .action(async function(this: Command, id: string, cmdOpts) {
      try {
        const data = await readJsonInput(cmdOpts);

        const opts = this.optsWithGlobals<PlatformCommandOptions>();
        const client = await clientFactory.createPlatformClient(opts);

        const provider = await client.ai.providers.update(id, data);
        say(`✓ Updated AI provider: ${provider.id}`);
        renderData(provider, getOutputMode(opts));
      } catch (error) {
        handleCommandError(error);
      }
    });

  // Delete provider
  providers
    .command("delete <id>")
    .description("Delete an AI provider")
    .option("--yes", "Skip confirmation prompt")
    .action(async function(this: Command, id: string, cmdOpts) {
      try {
        if (!cmdOpts.yes) {
          console.error("Error: Delete requires --yes confirmation flag");
          process.exitCode = 1;
          return;
        }

        const opts = this.optsWithGlobals<PlatformCommandOptions>();
        const client = await clientFactory.createPlatformClient(opts);

        await client.ai.providers.delete(id);
        emitDeleted(id, getOutputMode(opts), `✓ Deleted AI provider: ${id}`);
      } catch (error) {
        handleCommandError(error);
      }
    });

  // Test provider connection
  providers
    .command("test <id>")
    .description("Test an AI provider's credentials/connection")
    .action(async function(this: Command, id: string) {
      try {
        const opts = this.optsWithGlobals<PlatformCommandOptions>();
        const client = await clientFactory.createPlatformClient(opts);

        const result = await client.ai.providers.test(id);
        renderData(result, getOutputMode(opts));
      } catch (error) {
        handleCommandError(error);
      }
    });

  // Nested: models under a provider
  const models = providers
    .command("models")
    .description("AI models under a provider");

  // List models for a provider
  models
    .command("list <provider-id>")
    .description("List models for an AI provider")
    .action(async function(this: Command, providerId: string) {
      try {
        const opts = this.optsWithGlobals<PlatformCommandOptions>();
        const client = await clientFactory.createPlatformClient(opts);

        const result = await client.ai.providers.models.list(providerId);
        renderList(result as any[], {
          id: 'id',
          name: 'name',
          modelId: 'modelId',
          isDefault: 'isDefault',
          enabled: 'enabled',
        } as any, getOutputMode(opts));
      } catch (error) {
        handleCommandError(error);
      }
    });

  // Create model under a provider
  addDataOptions(models
    .command("create <provider-id>")
    .description("Create a new model under an AI provider"), "model data")
    .action(async function(this: Command, providerId: string, cmdOpts) {
      try {
        const data = await readJsonInput(cmdOpts);

        const opts = this.optsWithGlobals<PlatformCommandOptions>();
        const client = await clientFactory.createPlatformClient(opts);

        const model = await client.ai.providers.models.create(providerId, data);
        say(`✓ Created AI model: ${model.id}`);
        renderData(model, getOutputMode(opts));
      } catch (error) {
        handleCommandError(error);
      }
    });

  // Update model under a provider
  addDataOptions(models
    .command("update <provider-id> <model-id>")
    .description("Update a model under an AI provider"), "model data")
    .action(async function(this: Command, providerId: string, modelId: string, cmdOpts) {
      try {
        const data = await readJsonInput(cmdOpts);

        const opts = this.optsWithGlobals<PlatformCommandOptions>();
        const client = await clientFactory.createPlatformClient(opts);

        const model = await client.ai.providers.models.update(providerId, modelId, data);
        say(`✓ Updated AI model: ${model.id}`);
        renderData(model, getOutputMode(opts));
      } catch (error) {
        handleCommandError(error);
      }
    });

  // Delete model under a provider
  models
    .command("delete <provider-id> <model-id>")
    .description("Delete a model under an AI provider")
    .option("--yes", "Skip confirmation prompt")
    .action(async function(this: Command, providerId: string, modelId: string, cmdOpts) {
      try {
        if (!cmdOpts.yes) {
          console.error("Error: Delete requires --yes confirmation flag");
          process.exitCode = 1;
          return;
        }

        const opts = this.optsWithGlobals<PlatformCommandOptions>();
        const client = await clientFactory.createPlatformClient(opts);

        await client.ai.providers.models.delete(providerId, modelId);
        emitDeleted(modelId, getOutputMode(opts), `✓ Deleted AI model: ${modelId}`);
      } catch (error) {
        handleCommandError(error);
      }
    });
}
