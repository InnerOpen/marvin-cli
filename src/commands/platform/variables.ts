import { Command } from "commander";
import { clientFactory } from "../../shared/clients.js";
import { renderList, renderData } from "../../output.js";
import { getOutputMode, type PlatformCommandOptions } from "../../shared/types.js";
import { handleCommandError } from "../../shared/error-handler.js";
import { TABLE_SCHEMAS } from "../../shared/table-schemas.js";

export function registerVariableCommands(parent: Command): void {
  const variables = parent
    .command("variables")
    .description("Workspace variables management (plain-text key-value config)");

  // List
  variables
    .command("list")
    .description("List all variables")
    .action(async function(this: Command) {
      try {
        const opts = this.optsWithGlobals<PlatformCommandOptions>();
        const client = await clientFactory.createPlatformClient(opts);
        const items = await client.variables.list();
        renderList(items as any[], TABLE_SCHEMAS['variables.list'], getOutputMode(opts));
      } catch (error) {
        handleCommandError(error);
      }
    });

  // Create
  variables
    .command("create")
    .description("Create a new variable")
    .requiredOption("--name <name>", "Variable name")
    .requiredOption("--value <value>", "Variable value")
    .option("--slug <slug>", "Variable slug for {{SLUG}} interpolation (auto-generated if omitted)")
    .option("--description <description>", "Variable description")
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
        const variable = await client.variables.create(data);
        console.log(`✓ Created variable: ${variable.id}`);
        renderData(variable, getOutputMode(opts));
      } catch (error) {
        handleCommandError(error);
      }
    });

  // Update
  variables
    .command("update <id>")
    .description("Update a variable's name, value, or description")
    .option("--name <name>", "New variable name")
    .option("--value <value>", "New variable value")
    .option("--description <description>", "New variable description")
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
        const variable = await client.variables.update(id, data);
        console.log(`✓ Updated variable: ${variable.id}`);
        renderData(variable, getOutputMode(opts));
      } catch (error) {
        handleCommandError(error);
      }
    });

  // Delete
  variables
    .command("delete <id>")
    .description("Delete a variable")
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
        await client.variables.delete(id);
        console.log(`✓ Deleted variable: ${id}`);
      } catch (error) {
        handleCommandError(error);
      }
    });
}
