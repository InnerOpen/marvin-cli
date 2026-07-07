import { Command } from "commander";
import { credentialsManager } from "../../config/credentials.js";

export function registerWorkspaceCommands(parent: Command): void {
  // Workspace group
  const workspace = parent
    .command("workspace")
    .description("Workspace management commands");

  // Show current active workspace
  workspace
    .command("current")
    .description("Show current active workspace")
    .action(async () => {
      try {
        const activeWorkspace = credentialsManager.getActiveWorkspace();

        if (!activeWorkspace) {
          console.log("No active workspace set");
          console.log("Set one with: marvin platform workspace use <slug>");
          return;
        }

        console.log(`Active workspace: ${activeWorkspace}`);
      } catch (error) {
        console.error(error instanceof Error ? error.message : error);
        process.exitCode = 1;
      }
    });

  // Set active workspace
  workspace
    .command("use <slug>")
    .description("Set active workspace")
    .action(async (slug: string) => {
      try {
        credentialsManager.setActiveWorkspace(slug);
        console.log(`✓ Active workspace set to: ${slug}`);
      } catch (error) {
        console.error(error instanceof Error ? error.message : error);
        process.exitCode = 1;
      }
    });

  // Note: Workspace CRUD operations are managed at the server level
  // The Platform API operates within a workspace context set via authentication
}
