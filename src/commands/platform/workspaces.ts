import { writeFileSync, readFileSync } from "node:fs";
import { Command } from "commander";
import { credentialsManager } from "../../config/credentials.js";
import { clientFactory } from "../../shared/clients.js";
import { getOutputMode } from '../../shared/types.js';
import { handleCommandError } from '../../shared/error-handler.js';
import { renderData } from "../../output.js";
import type { PlatformCommandOptions } from "../../shared/types.js";
import type { WorkspaceWithMembership } from "@inneropen/marvin-sdk/platform";
import { promptSecure, readFromStdin } from "../../shared/prompt.js";
import { addDataOptions, readJsonInput } from "../../shared/json-input.js";
import { say, emitDeleted, emitOk } from "../../shared/io.js";

export function registerWorkspaceCommands(parent: Command, opts?: { hidden?: boolean }): void {
  // Workspace group
  const workspace = new Command("workspace")
    .description("Workspace management commands");

  parent.addCommand(workspace, { hidden: opts?.hidden });

  // Show current active workspace
  workspace
    .command("current")
    .description("Show current active workspace (from local credentials)")
    .action(async function (this: Command) {
      try {
        const opts = this.optsWithGlobals<PlatformCommandOptions>();
        const localSlug = credentialsManager.getActiveWorkspace();
        const mode = getOutputMode(opts);

        if (mode !== "table") {
          // Machine-readable callers still need a slug field when nothing is set, so emit null
          // rather than dropping the key — `.slug` stays addressable either way.
          renderData({ slug: localSlug ?? null }, mode);
          return;
        }

        if (localSlug) {
          process.stdout.write(`Active workspace: ${localSlug}\n`);
        } else {
          say("No active workspace set");
        }
      } catch (error) {
        handleCommandError(error);
        process.exitCode = 1;
      }
    });

  // Set active workspace (by slug or ID)
  workspace
    .command("use <workspace>")
    .description("Set active workspace by slug or ID")
    .action(async (workspaceIdentifier: string) => {
      try {
        const client = await clientFactory.createPlatformClient(parent.optsWithGlobals<PlatformCommandOptions>());

        // Backend now accepts slug OR ID directly
        const workspace = await client.workspaces.setActive(workspaceIdentifier);

        // Also save slug locally for convenience
        credentialsManager.setActiveWorkspace(workspace.slug ?? '');

        emitOk(
          { id: workspace.id, slug: workspace.slug, name: workspace.name },
          getOutputMode(parent.optsWithGlobals<PlatformCommandOptions>()),
          `✓ Active workspace set to: ${workspace.name} (${workspace.slug})`,
        );
      } catch (error) {
        if (error instanceof Error && error.message.includes('not found')) {
          console.error(error.message);
          say("\nTry: marvin workspace list");
        } else {
          handleCommandError(error);
        }
        process.exitCode = 1;
      }
    });

  // List accessible workspaces
  workspace
    .command("list")
    .description("List all accessible workspaces")
    .action(async () => {
      try {
        const client = await clientFactory.createPlatformClient(parent.optsWithGlobals<PlatformCommandOptions>());

        const workspaces = await client.workspaces.list();
        const mode = getOutputMode(parent.optsWithGlobals<PlatformCommandOptions>());

        if (mode !== "table") {
          renderData(workspaces ?? [], mode);
          return;
        }

        if (!workspaces || workspaces.length === 0) {
          say("No workspaces found");
          return;
        }

        say("\nAccessible Workspaces:");
        say("─".repeat(70));

        workspaces.forEach((w: WorkspaceWithMembership) => {
          const active = w.isActive ? "✓ ACTIVE" : "";
          const hasSiteToken = credentialsManager.getSiteToken(w.workspace.slug ?? '') ? "🔑" : "";
          process.stdout.write(
            `${w.workspace.name} (${w.workspace.slug}) ${hasSiteToken}\n` +
            `  Role: ${w.role}  ${active}\n` +
            `  ID: ${w.workspace.id}\n\n`,
          );
        });

      } catch (error) {
        handleCommandError(error);
        process.exitCode = 1;
      }
    });

  // Set site token for workspace
  workspace
    .command("token")
    .description("Store site token for current workspace (for Publishing API)")
    .option("--for <slug>", "Workspace slug (defaults to active workspace)")
    .option("--from-stdin", "Read token from stdin (pipe input)")
    .action(async (cmdOpts: { for?: string; fromStdin?: boolean }) => {
      try {
        // Resolve workspace (use --for option or active workspace)
        const workspaceSlug = cmdOpts.for || credentialsManager.getActiveWorkspace();

        if (!workspaceSlug) {
          console.error("No active workspace set.");
          say("Either:");
          say("  1. Set active workspace: marvin workspace use <slug>");
          say("  2. Specify workspace: marvin workspace token --for <slug>");
          process.exitCode = 1;
          return;
        }

        let siteToken: string;

        // Read token from stdin or prompt
        if (cmdOpts.fromStdin) {
          siteToken = await readFromStdin();
        } else {
          siteToken = await promptSecure("Enter site token (input hidden):");
        }

        if (!siteToken) {
          console.error("Error: Site token is required");
          process.exitCode = 1;
          return;
        }

        // Save the token
        credentialsManager.setSiteToken(workspaceSlug, siteToken);

        say(`✓ Site token saved for workspace: ${workspaceSlug}`);
        say("\nYou can now use Publishing API commands without --site-token flag:");
        say("  marvin publish entries");
        say("  marvin publish collections");
        say("\nUsage examples:");
        say("  Interactive: marvin workspace token");
        say("  From stdin:  echo 'token' | marvin workspace token --from-stdin");
      } catch (error) {
        handleCommandError(error);
        process.exitCode = 1;
      }
    });

  // Export workspace data
  workspace
    .command("export")
    .description(
      "Export the whole workspace as a JSON seed (content, structure, settings, integrations, workflows) " +
      "for restore or migration; for a restorable ZIP use 'workspace backups create'"
    )
    .option("-o, --out-file <file>", "Write to file instead of stdout")
    .option("--include-system-types", "Include system entry types in export", false)
    .option("--no-pretty", "Output compact JSON instead of pretty-printed")
    .action(async (cmdOpts: { outFile?: string; includeSystemTypes?: boolean; pretty?: boolean }) => {
      try {
        const client = await clientFactory.createPlatformClient(parent.optsWithGlobals<PlatformCommandOptions>());

        const data = await client.workspaces.export({
          includeSystemTypes: cmdOpts.includeSystemTypes,
          pretty: cmdOpts.pretty,
        });

        const json = cmdOpts.pretty !== false
          ? JSON.stringify(data, null, 2)
          : JSON.stringify(data);

        if (cmdOpts.outFile) {
          writeFileSync(cmdOpts.outFile, json + "\n", "utf-8");
          emitOk(
            { file: cmdOpts.outFile },
            getOutputMode(parent.optsWithGlobals<PlatformCommandOptions>()),
            `✓ Workspace exported to ${cmdOpts.outFile}`,
          );
        } else {
          process.stdout.write(json + "\n");
        }
      } catch (error) {
        handleCommandError(error);
        process.exitCode = 1;
      }
    });

  // Remove site token for workspace
  workspace
    .command("token:remove")
    .description("Remove stored site token for current workspace")
    .option("--for <slug>", "Workspace slug (defaults to active workspace)")
    .action(async (cmdOpts: { for?: string }) => {
      try {
        // Resolve workspace
        const workspaceSlug = cmdOpts.for || credentialsManager.getActiveWorkspace();

        if (!workspaceSlug) {
          console.error("No active workspace set.");
          process.exitCode = 1;
          return;
        }

        // Check if token exists
        const hasToken = credentialsManager.getSiteToken(workspaceSlug);
        if (!hasToken) {
          say(`No site token stored for workspace: ${workspaceSlug}`);
          return;
        }

        // Remove the token
        credentialsManager.removeSiteToken(workspaceSlug);
        emitDeleted(
          workspaceSlug,
          getOutputMode(parent.optsWithGlobals<PlatformCommandOptions>()),
          `✓ Site token removed for workspace: ${workspaceSlug}`,
        );
      } catch (error) {
        handleCommandError(error);
        process.exitCode = 1;
      }
    });

  // Import workspace bundle
  workspace
    .command("import")
    .description("Import a workspace bundle (a ZIP from 'workspace backups create'/'download')")
    .requiredOption("--file <path>", "Path to the ZIP bundle file to import")
    .option("--overwrite", "Overwrite existing records matched by slug", false)
    .action(async (cmdOpts: { file: string; overwrite?: boolean }) => {
      try {
        const client = await clientFactory.createPlatformClient(parent.optsWithGlobals<PlatformCommandOptions>());

        const fileContent = readFileSync(cmdOpts.file);
        const blob = new Blob([fileContent], { type: "application/zip" });

        say(`Importing bundle from: ${cmdOpts.file}`);
        const result = await client.workspaces.importBundle(blob, { overwrite: cmdOpts.overwrite });

        const lines = ["✓ Import complete"];
        if (result.imported) {
          Object.entries(result.imported).forEach(([type, count]) => {
            lines.push(`  ${type}: ${count}`);
          });
        }
        emitOk(result as Record<string, unknown>, getOutputMode(parent.optsWithGlobals<PlatformCommandOptions>()), ...lines);
      } catch (error) {
        handleCommandError(error);
        process.exitCode = 1;
      }
    });

  // Workspace preferences
  const preferences = workspace
    .command("preferences")
    .description("Workspace preferences management");

  preferences
    .action(async () => {
      try {
        const client = await clientFactory.createPlatformClient(parent.optsWithGlobals<PlatformCommandOptions>());
        const current = await client.workspaces.getCurrent();
        const prefs = await client.workspaces.getPreferences(current.id);
        renderData(prefs, getOutputMode(parent.optsWithGlobals<PlatformCommandOptions>()));
      } catch (error) {
        handleCommandError(error);
        process.exitCode = 1;
      }
    });

  addDataOptions(preferences
    .command("update")
    .description("Update workspace preferences"), "preferences data")
    .action(async (cmdOpts: { data?: string; file?: string }) => {
      try {
        const data = await readJsonInput(cmdOpts);

        const client = await clientFactory.createPlatformClient(parent.optsWithGlobals<PlatformCommandOptions>());
        const current = await client.workspaces.getCurrent();
        const prefs = await client.workspaces.updatePreferences(current.id, data);

        say("✓ Updated workspace preferences");
        renderData(prefs, getOutputMode(parent.optsWithGlobals<PlatformCommandOptions>()));
      } catch (error) {
        handleCommandError(error);
        process.exitCode = 1;
      }
    });

  // Platform-level stats for the current workspace
  workspace
    .command("stats")
    .description("Show platform-level stats for the current workspace")
    .action(async function(this: Command) {
      try {
        const opts = parent.optsWithGlobals<PlatformCommandOptions>();
        const client = await clientFactory.createPlatformClient(opts);
        const stats = await client.workspaces.getStats();
        renderData(stats, getOutputMode(opts));
      } catch (error) {
        handleCommandError(error);
        process.exitCode = 1;
      }
    });

  // Workspace backups
  const backups = workspace
    .command("backups")
    .description("Workspace backup management");

  backups
    .command("list")
    .description("List available workspace backups")
    .action(async function(this: Command) {
      try {
        const opts = parent.optsWithGlobals<PlatformCommandOptions>();
        const client = await clientFactory.createPlatformClient(opts);
        const items = await client.workspaces.listBackups();
        renderData(items, getOutputMode(opts));
      } catch (error) {
        handleCommandError(error);
        process.exitCode = 1;
      }
    });

  backups
    .command("download <filename>")
    .description("Download a workspace backup by filename")
    .option("-o, --out-file <file>", "Write backup to file instead of stdout")
    .action(async function(this: Command, filename: string, cmdOpts: { outFile?: string }) {
      try {
        const opts = parent.optsWithGlobals<PlatformCommandOptions>();
        const client = await clientFactory.createPlatformClient(opts);
        const data = await client.workspaces.downloadBackup(filename);

        if (cmdOpts.outFile) {
          let buffer: Buffer;
          if (Buffer.isBuffer(data)) {
            buffer = data;
          } else if (data instanceof ArrayBuffer) {
            buffer = Buffer.from(new Uint8Array(data));
          } else if (typeof (data as any)?.arrayBuffer === "function") {
            // Blob-like
            buffer = Buffer.from(new Uint8Array(await (data as Blob).arrayBuffer()));
          } else if (typeof data === "string") {
            buffer = Buffer.from(data, "utf-8");
          } else {
            buffer = Buffer.from(JSON.stringify(data, null, 2), "utf-8");
          }
          writeFileSync(cmdOpts.outFile, buffer);
          emitOk({ file: cmdOpts.outFile, bytes: buffer.length }, getOutputMode(opts), `✓ Backup written to ${cmdOpts.outFile}`);
        } else {
          renderData(data, getOutputMode(opts));
        }
      } catch (error) {
        handleCommandError(error);
        process.exitCode = 1;
      }
    });

  backups
    .command("create")
    .description("Create a new backup of the current workspace")
    .action(async function(this: Command) {
      try {
        const opts = parent.optsWithGlobals<PlatformCommandOptions>();
        const client = await clientFactory.createPlatformClient(opts);
        const result = await client.workspaces.createBackup();
        say("✓ Backup created");
        renderData(result, getOutputMode(opts));
      } catch (error) {
        handleCommandError(error);
        process.exitCode = 1;
      }
    });
}
