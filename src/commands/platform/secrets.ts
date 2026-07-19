import { Command } from "commander";
import { clientFactory } from "../../shared/clients.js";
import { renderList, renderData } from "../../output.js";
import { getOutputMode, type PlatformCommandOptions } from "../../shared/types.js";
import { handleCommandError } from "../../shared/error-handler.js";
import { TABLE_SCHEMAS } from "../../shared/table-schemas.js";

export function registerSecretCommands(parent: Command): void {
  const secrets = parent
    .command("secrets")
    .description("Workspace secrets management (write-only encrypted values)");

  // List
  secrets
    .command("list")
    .description("List all secrets (metadata only — values are never returned)")
    .action(async function(this: Command) {
      try {
        const opts = this.optsWithGlobals<PlatformCommandOptions>();
        const client = await clientFactory.createPlatformClient(opts);
        const items = await client.secrets.list();
        renderList(items as any[], TABLE_SCHEMAS['secrets.list'], getOutputMode(opts));
      } catch (error) {
        handleCommandError(error);
      }
    });

  // Slugs
  secrets
    .command("slugs")
    .description("List available secret slugs for {{SLUG}} interpolation")
    .action(async function(this: Command) {
      try {
        const opts = this.optsWithGlobals<PlatformCommandOptions>();
        const client = await clientFactory.createPlatformClient(opts);
        const slugs = await client.secrets.slugs();
        if (getOutputMode(opts) === "json") {
          console.log(JSON.stringify(slugs, null, 2));
        } else {
          (slugs as string[]).forEach((slug) => console.log(slug));
        }
      } catch (error) {
        handleCommandError(error);
      }
    });

  // Reveal
  secrets
    .command("reveal <id>")
    .description("Reveal the plaintext value of a secret (requires appropriate permissions)")
    .action(async function(this: Command, id: string) {
      try {
        const opts = this.optsWithGlobals<PlatformCommandOptions>();
        const client = await clientFactory.createPlatformClient(opts);
        const result = await client.secrets.reveal(id);
        renderData(result, getOutputMode(opts));
      } catch (error) {
        handleCommandError(error);
      }
    });

  // Create
  secrets
    .command("create")
    .description("Create a new secret (value is encrypted and never returned in reads)")
    .requiredOption("--name <name>", "Secret name")
    .requiredOption("--value <value>", "Secret value (will be encrypted at rest)")
    .option("--slug <slug>", "Secret slug for {{SLUG}} interpolation (auto-generated if omitted)")
    .option("--description <description>", "Secret description")
    .action(async function(this: Command, cmdOpts) {
      try {
        const opts = this.optsWithGlobals<PlatformCommandOptions>();
        const client = await clientFactory.createPlatformClient(opts);
        const rawSlug = cmdOpts.slug || cmdOpts.name;
        const data: any = {
          name: cmdOpts.name,
          slug: rawSlug.toUpperCase().replace(/[^A-Z0-9]+/g, '_'),
          value: cmdOpts.value,
        };
        if (cmdOpts.description) data.description = cmdOpts.description;
        const secret = await client.secrets.create(data);
        console.log(`✓ Created secret: ${secret.id}`);
        renderData(secret, getOutputMode(opts));
      } catch (error) {
        handleCommandError(error);
      }
    });

  // Update
  secrets
    .command("update <id>")
    .description("Update a secret's name, description, or value")
    .option("--name <name>", "New secret name")
    .option("--value <value>", "New secret value (will be encrypted at rest)")
    .option("--description <description>", "New secret description")
    .action(async function(this: Command, id: string, cmdOpts) {
      try {
        const data: any = {};
        if (cmdOpts.name) data.name = cmdOpts.name;
        if (cmdOpts.value) data.value = cmdOpts.value;
        if (cmdOpts.description !== undefined) data.description = cmdOpts.description;
        if (Object.keys(data).length === 0) {
          console.error("Error: Provide at least one of --name, --value, or --description");
          process.exitCode = 1;
          return;
        }
        const opts = this.optsWithGlobals<PlatformCommandOptions>();
        const client = await clientFactory.createPlatformClient(opts);
        const secret = await client.secrets.update(id, data);
        console.log(`✓ Updated secret: ${secret.id}`);
        renderData(secret, getOutputMode(opts));
      } catch (error) {
        handleCommandError(error);
      }
    });

  // Delete
  secrets
    .command("delete <id>")
    .description("Delete a secret")
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
        await client.secrets.delete(id);
        console.log(`✓ Deleted secret: ${id}`);
      } catch (error) {
        handleCommandError(error);
      }
    });
}
