import { Command } from "commander";
import { clientFactory } from "../../shared/clients.js";
import { renderList, renderData } from "../../output.js";
import { getOutputMode, type PlatformCommandOptions } from "../../shared/types.js";
import { handleCommandError } from "../../shared/error-handler.js";
import { TABLE_SCHEMAS } from "../../shared/table-schemas.js";
import { say, warn, emitDeleted } from "../../shared/io.js";
import { promptSecure, readFromStdin } from "../../shared/prompt.js";

interface SecretValueOptions {
  value?: string;
  valueStdin?: boolean;
}

/**
 * The secret's value, without it landing in shell history: `--value-stdin` reads it from a pipe,
 * otherwise an interactive terminal prompts for it (hidden). `--value` still works but warns.
 * Returns undefined when `optional` and nothing was given (update without a new value).
 */
async function resolveSecretValue(cmdOpts: SecretValueOptions, optional: boolean): Promise<string | undefined> {
  if (cmdOpts.value !== undefined && cmdOpts.valueStdin) {
    throw new Error("Use either --value-stdin or --value, not both");
  }
  if (cmdOpts.valueStdin) {
    const value = await readFromStdin();
    if (!value) throw new Error("--value-stdin read an empty value");
    return value;
  }
  if (cmdOpts.value !== undefined) {
    warn("--value puts the secret in your shell history; prefer --value-stdin or the interactive prompt.");
    return cmdOpts.value;
  }
  if (optional) return undefined;
  if (!process.stdin.isTTY) {
    throw new Error("No secret value: pipe it in with --value-stdin (or run interactively to be prompted)");
  }
  const value = await promptSecure("Secret value (input hidden):");
  if (!value) throw new Error("Secret value is required");
  return value;
}

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
        const mode = getOutputMode(opts);
        if (mode === "table") {
          for (const slug of slugs as string[]) process.stdout.write(`${slug}\n`);
        } else {
          renderData(slugs, mode);
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
    .option("--value-stdin", "Read the secret value from stdin (e.g. `pass show x | marvin … --value-stdin`)")
    .option("--value <value>", "Secret value (deprecated: lands in shell history; prompts when omitted)")
    .option("--slug <slug>", "Secret slug for {{SLUG}} interpolation (auto-generated if omitted)")
    .option("--description <description>", "Secret description")
    .action(async function(this: Command, cmdOpts) {
      try {
        const opts = this.optsWithGlobals<PlatformCommandOptions>();
        const value = await resolveSecretValue(cmdOpts, false);
        const client = await clientFactory.createPlatformClient(opts);
        const rawSlug = cmdOpts.slug || cmdOpts.name;
        const data: any = {
          name: cmdOpts.name,
          slug: rawSlug.toUpperCase().replace(/[^A-Z0-9]+/g, '_'),
          value,
        };
        if (cmdOpts.description) data.description = cmdOpts.description;
        const secret = await client.secrets.create(data);
        say(`✓ Created secret: ${secret.id}`);
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
    .option("--value-stdin", "Read a new secret value from stdin")
    .option("--value <value>", "New secret value (deprecated: lands in shell history)")
    .option("--description <description>", "New secret description")
    .action(async function(this: Command, id: string, cmdOpts) {
      try {
        const data: any = {};
        if (cmdOpts.name) data.name = cmdOpts.name;
        const value = await resolveSecretValue(cmdOpts, true);
        if (value) data.value = value;
        if (cmdOpts.description !== undefined) data.description = cmdOpts.description;
        if (Object.keys(data).length === 0) {
          console.error("Error: Provide at least one of --name, --value-stdin, or --description");
          process.exitCode = 1;
          return;
        }
        const opts = this.optsWithGlobals<PlatformCommandOptions>();
        const client = await clientFactory.createPlatformClient(opts);
        const secret = await client.secrets.update(id, data);
        say(`✓ Updated secret: ${secret.id}`);
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
        emitDeleted(id, getOutputMode(opts), `✓ Deleted secret: ${id}`);
      } catch (error) {
        handleCommandError(error);
      }
    });
}
