import { Command } from "commander";
import { writeFileSync } from "fs";
import { clientFactory } from "../../shared/clients.js";
import { getOutputMode } from '../../shared/types.js';
import { handleCommandError } from '../../shared/error-handler.js';
import type { PlatformCommandOptions } from "../../shared/types.js";
import { renderList, renderData } from "../../output.js";
import { addDataOptions, readJsonInput } from "../../shared/json-input.js";
import { say, emitOk } from "../../shared/io.js";

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
    .option("-o, --out-file <path>", "Write backup content to a file instead of stdout")
    .action(async function(this: Command, filename: string, cmdOpts) {
      try {
        const client = await clientFactory.createPlatformClient(parent.optsWithGlobals<PlatformCommandOptions>());
        const result = await client.adminBackups.download(filename);

        if (cmdOpts.outFile) {
          let content: string | Buffer;
          if (typeof result === "string" || Buffer.isBuffer(result)) {
            content = result as string | Buffer;
          } else {
            content = JSON.stringify(result, null, 2);
          }
          writeFileSync(cmdOpts.outFile, content);
          say(`✓ Backup written to ${cmdOpts.outFile}`);
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

        say(`✓ Created backup for workspace ${workspaceId}`);
        const globalOpts = parent.optsWithGlobals<PlatformCommandOptions>();
        renderData(result, getOutputMode(globalOpts));
      } catch (error) {
        handleCommandError(error);
        process.exitCode = 1;
      }
    });

  // Import backup into workspace
  addDataOptions(backups
    .command("import <workspace-id>")
    .description("Import a backup into a workspace"), "backup data")
    .action(async function(this: Command, workspaceId: string, cmdOpts) {
      try {
        const data = await readJsonInput(cmdOpts);

        const client = await clientFactory.createPlatformClient(parent.optsWithGlobals<PlatformCommandOptions>());
        const result = await client.adminBackups.importForWorkspace(workspaceId, data);

        const mode = getOutputMode(parent.optsWithGlobals<PlatformCommandOptions>());
        emitOk(result as Record<string, unknown>, mode, `✓ Imported backup into workspace ${workspaceId}`);
        if (mode === "table" && result) renderData(result, mode);
      } catch (error) {
        handleCommandError(error);
        process.exitCode = 1;
      }
    });
}
