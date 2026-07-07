import { Command } from "commander";
import { credentialsManager } from "../../config/credentials.js";
import { clientFactory } from "../../shared/clients.js";
import type { PlatformCommandOptions } from "../../shared/types.js";

export function registerWorkspaceCommands(parent: Command): void {
  // Workspace group
  const workspace = new Command("workspace")
    .description("Workspace management commands");

  parent.addCommand(workspace);

  // Show current active workspace
  workspace
    .command("current")
    .description("Show current active workspace from server")
    .action(async () => {
      try {
        const client = await clientFactory.createPlatformClient(parent.optsWithGlobals<PlatformCommandOptions>());

        // Call the backend to get the actual active workspace
        const currentWorkspace = await client.workspaces.getCurrent();

        console.log(`Active workspace: ${currentWorkspace.name} (${currentWorkspace.slug})`);
        console.log(`ID: ${currentWorkspace.id}`);

        // Show if local cache matches
        const localSlug = credentialsManager.getActiveWorkspace();
        if (localSlug && localSlug !== currentWorkspace.slug) {
          console.log(`\n⚠️  Local cache (${localSlug}) differs from server (${currentWorkspace.slug})`);
        }
      } catch (error) {
        console.error(error instanceof Error ? error.message : error);
        process.exitCode = 1;
      }
    });

  // Set active workspace (by slug)
  workspace
    .command("use <slug>")
    .description("Set active workspace by slug")
    .action(async (slug: string) => {
      try {
        const client = await clientFactory.createPlatformClient(parent.optsWithGlobals<PlatformCommandOptions>());

        // Use the SDK's convenience method to set by slug
        const workspace = await client.workspaces.setActiveBySlug(slug);

        // Also save slug locally for convenience
        credentialsManager.setActiveWorkspace(slug);

        console.log(`✓ Active workspace set to: ${workspace.name} (${slug})`);
      } catch (error) {
        if (error instanceof Error && error.message.includes('not found')) {
          console.error(error.message);
          console.log("\nTry: marvin platform workspace list");
        } else {
          console.error(error instanceof Error ? error.message : error);
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

        if (!workspaces || workspaces.length === 0) {
          console.log("No workspaces found");
          return;
        }

        console.log("\nAccessible Workspaces:");
        console.log("─".repeat(70));

        workspaces.forEach(w => {
          const active = w.is_active ? "✓ ACTIVE" : "";
          console.log(`${w.workspace.name} (${w.workspace.slug})`);
          console.log(`  Role: ${w.role}  ${active}`);
          console.log(`  ID: ${w.workspace.id}`);
          console.log();
        });

      } catch (error) {
        console.error(error instanceof Error ? error.message : error);
        process.exitCode = 1;
      }
    });
}
