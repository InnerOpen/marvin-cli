import { Command } from "commander";
import { MarvinApiError } from "@inneropen/marvin-sdk";
import { clientFactory } from "../../shared/clients.js";
import { getOutputMode } from '../../shared/types.js';
import { handleCommandError } from '../../shared/error-handler.js';
import type { PlatformCommandOptions } from "../../shared/types.js";
import { renderList, renderData } from "../../output.js";
import { addDataOptions, readJsonInput } from "../../shared/json-input.js";
import { addPageOptions, fetchPages } from "../../shared/pagination.js";
import { say, emitDeleted } from "../../shared/io.js";

export function registerAdminGroupCommands(parent: Command): void {
  const groups = new Command("groups")
    .description("Workspace/group management (requires SUPER_ADMIN)");

  parent.addCommand(groups);

  // List groups
  addPageOptions(groups
    .command("list")
    .description("List workspaces/groups (one page; --all for every page)"))
    .action(async function(this: Command, cmdOpts) {
      try {
        const client = await clientFactory.createPlatformClient(parent.optsWithGlobals<PlatformCommandOptions>());
        const items = await fetchPages<any>(client, "/api/admin/groups", cmdOpts);

        const globalOpts = parent.optsWithGlobals<PlatformCommandOptions>();
        renderList(items, {
          id: 'id',
          name: 'name',
          slug: 'slug',
        } as any, getOutputMode(globalOpts));
      } catch (error) {
        handleCommandError(error);
        process.exitCode = 1;
      }
    });

  // Create group
  addDataOptions(groups
    .command("create")
    .description("Create a new workspace/group"), "group data")
    .action(async function(this: Command, cmdOpts) {
      try {
        const data = await readJsonInput(cmdOpts);

        const client = await clientFactory.createPlatformClient(parent.optsWithGlobals<PlatformCommandOptions>());
        const result = await client.workspaces.create(data);

        say(`✓ Created group: ${result.id}`);
        const globalOpts = parent.optsWithGlobals<PlatformCommandOptions>();
        renderData(result, getOutputMode(globalOpts));
      } catch (error) {
        handleCommandError(error);
        process.exitCode = 1;
      }
    });

  // Get group
  groups
    .command("get <id>")
    .description("Get a workspace/group by ID")
    .action(async function(this: Command, id: string) {
      try {
        const client = await clientFactory.createPlatformClient(parent.optsWithGlobals<PlatformCommandOptions>());
        const result = await client.workspaces.get(id);

        const globalOpts = parent.optsWithGlobals<PlatformCommandOptions>();
        renderData(result, getOutputMode(globalOpts));
      } catch (error) {
        handleCommandError(error);
        process.exitCode = 1;
      }
    });

  // Update group
  addDataOptions(groups
    .command("update <id>")
    .description("Update a workspace/group"), "group data")
    .action(async function(this: Command, id: string, cmdOpts) {
      try {
        const data = await readJsonInput(cmdOpts);

        const client = await clientFactory.createPlatformClient(parent.optsWithGlobals<PlatformCommandOptions>());
        const result = await client.workspaces.update(id, data);

        say(`✓ Updated group: ${result.id}`);
        const globalOpts = parent.optsWithGlobals<PlatformCommandOptions>();
        renderData(result, getOutputMode(globalOpts));
      } catch (error) {
        handleCommandError(error);
        process.exitCode = 1;
      }
    });

  // Delete group
  groups
    .command("delete <id>")
    .description("Delete a workspace/group")
    .option("--yes", "Skip confirmation prompt")
    .option("--force", "Force deletion even if the group has members/content")
    .option("--confirm-name <name>", "The workspace's name, as confirmation (default with --yes: looked up from the id)")
    .option("--skip-backup", "Delete without a recent backup")
    .action(async function(this: Command, id: string, cmdOpts) {
      try {
        if (!cmdOpts.yes) {
          console.error("Error: Delete requires --yes confirmation flag");
          process.exitCode = 1;
          return;
        }

        const client = await clientFactory.createPlatformClient(parent.optsWithGlobals<PlatformCommandOptions>());

        // The server wants the workspace's name typed back. --yes is the explicit confirmation, so
        // when no name is given, send the workspace's own.
        const confirmName: string = cmdOpts.confirmName ?? (await client.workspaces.get(id)).name;

        await client.workspaces.delete(id, {
          force: cmdOpts.force === true,
          confirmName,
          skipBackup: cmdOpts.skipBackup === true,
        });

        emitDeleted(id, getOutputMode(parent.optsWithGlobals<PlatformCommandOptions>()), `✓ Deleted group: ${id}`);
      } catch (error) {
        handleCommandError(explainDeleteError(error, id));
        process.exitCode = 1;
      }
    });
}

/** The server's `{ code, message }` detail for a refused delete, if that is what the error carries. */
function deleteRefusal(error: unknown): { code?: string; message?: string } | undefined {
  if (!(error instanceof MarvinApiError) || !error.responseBody) return undefined;
  try {
    const detail = JSON.parse(error.responseBody).detail;
    return detail && typeof detail === "object" && !Array.isArray(detail) ? detail : undefined;
  } catch {
    return undefined;
  }
}

/** Turn the delete safety refusals (no recent backup, wrong name) into messages that say what to do next. */
function explainDeleteError(error: unknown, id: string): unknown {
  const refusal = deleteRefusal(error);
  if (refusal?.code === "backup_required") {
    return new Error(
      `${refusal.message ?? "No backup from the last 24 hours."} ` +
      `Back it up first with 'marvin admin backups create ${id}', or pass --skip-backup to delete without one.`,
    );
  }
  if (refusal?.code === "confirm_name_mismatch") {
    return new Error(`${refusal.message ?? "The name does not match."} Check the --confirm-name value.`);
  }
  return error;
}
