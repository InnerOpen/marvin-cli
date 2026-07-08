import { Command } from "commander";
import { credentialsManager } from "../../config/credentials.js";
import { clientFactory } from "../../shared/clients.js";
import type { PlatformCommandOptions } from "../../shared/types.js";

export function registerWorkspaceCommands(parent: Command): void {
  // Workspace group
  const workspace = parent
    .command("workspace")
    .description("Workspace management commands");

  // Show current active workspace
  workspace
    .command("current")
    .description("Show current active workspace (from local credentials)")
    .action(async () => {
      try {
        const localSlug = credentialsManager.getActiveWorkspace();
        if (localSlug) {
          console.log(`Active workspace: ${localSlug}`);
        } else {
          console.log("No active workspace set");
        }
      } catch (error) {
        console.error(error instanceof Error ? error.message : error);
        process.exitCode = 1;
      }
    });

  // Set active workspace (by slug)
  workspace
    .command("use <slug>")
    .description("Set active workspace by slug (stored locally)")
    .action(async (slug: string) => {
      try {
        // Save slug locally
        credentialsManager.setActiveWorkspace(slug);
        console.log(`✓ Active workspace set to: ${slug}`);
      } catch (error) {
        console.error(error instanceof Error ? error.message : error);
        process.exitCode = 1;
      }
    });

  // List accessible workspaces
  workspace
    .command("list")
    .description("List all accessible workspaces")
    .action(async () => {
      try {
        console.log("Workspace listing not yet implemented in SDK");
        console.log("Current workspace can be shown with: marvin workspace current");
      } catch (error) {
        console.error(error instanceof Error ? error.message : error);
        process.exitCode = 1;
      }
    });
}
