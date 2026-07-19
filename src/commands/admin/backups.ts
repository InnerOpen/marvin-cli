import { Command } from "commander";
import { writeFileSync } from "fs";
import { clientFactory } from "../../shared/clients.js";
import { getOutputMode } from '../../shared/types.js';
import { handleCommandError } from '../../shared/error-handler.js';
import type { PlatformCommandOptions } from "../../shared/types.js";
import { renderList, renderData } from "../../output.js";
import { readJsonInput } from "../../shared/json-input.js";

export function registerAdminBackupCommands(parent: Command): void {
  const backups = new Command("backups")
    .description("System backup management (requires SUPER_ADMIN)");

  parent.addCommand(backups);

  // List backups
  backups
    .command("list")
    .description("List all available backups")
    .action(async function(this: Command) {
      try {
        const client = await clientFactory.createPlatformClient(parent.optsWithGlobals<PlatformCommandOptions>());
        const result = await client.adminBackups.list();

        const globalOpts = parent.optsWithGlobals<PlatformCommandOptions>();
        renderList(result as any[], {
          filename: 'filename',
          size: 'size',
          createdAt: 'createdAt',
        } as any, getOutputMode(globalOpts));
      } catch (error) {
        handleCommandError(error);
        process.exitCode = 1;
      }
    });

  // Download backup
  backups
    .command("download <filename>")
    .description("Download a backup file by filename")
    .option("-o, --output <path>", "Write backup content to a file")
    .action(async function(this: Command, filename: string, cmdOpts) {
      try {
        const client = await clientFactory.createPlatformClient(parent.optsWithGlobals<PlatformCommandOptions>());
        const result = await client.adminBackups.download(filename);

        if (cmdOpts.output) {
          let content: string | Buffer;
          if (typeof result === "string" || Buffer.isBuffer(result)) {
            content = result as string | Buffer;
          } else {
            content = JSON.stringify(result, null, 2);
          }
          writeFileSync(cmdOpts.output, content);
          console.log(`✓ Backup written to ${cmdOpts.output}`);
        } else {
          const globalOpts = parent.optsWithGlobals<PlatformCommandOptions>();
          renderData(result, getOutputMode(globalOpts));
        }
      } catch (error) {
        handleCommandError(error);
        process.exitCode = 1;
      }
    });

  // Create backup for workspace
  backups
    .command("create <workspace-id>")
    .description("Create a backup for a workspace")
    .action(async function(this: Command, workspaceId: string) {
      try {
        const client = await clientFactory.createPlatformClient(parent.optsWithGlobals<PlatformCommandOptions>());
        const result = await client.adminBackups.createForWorkspace(workspaceId);

        console.log(`✓ Created backup for workspace ${workspaceId}`);
        const globalOpts = parent.optsWithGlobals<PlatformCommandOptions>();
        renderData(result, getOutputMode(globalOpts));
      } catch (error) {
        handleCommandError(error);
        process.exitCode = 1;
      }
    });

  // Import backup into workspace
  backups
    .command("import <workspace-id>")
    .description("Import a backup into a workspace")
    .requiredOption("--file <path>", "Path to backup JSON file (use '-' for stdin)")
    .option("--json <json>", "Backup data as JSON string")
    .action(async function(this: Command, workspaceId: string, cmdOpts) {
      try {
        const data = await readJsonInput(cmdOpts);

        const client = await clientFactory.createPlatformClient(parent.optsWithGlobals<PlatformCommandOptions>());
        const result = await client.adminBackups.importForWorkspace(workspaceId, data);

        console.log(`✓ Imported backup into workspace ${workspaceId}`);
        const globalOpts = parent.optsWithGlobals<PlatformCommandOptions>();
        renderData(result, getOutputMode(globalOpts));
      } catch (error) {
        handleCommandError(error);
        process.exitCode = 1;
      }
    });
}
