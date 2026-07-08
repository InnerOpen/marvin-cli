import { Command } from "commander";
import { credentialsManager } from "../../config/credentials.js";
import { clientFactory } from "../../shared/clients.js";
import type { PlatformCommandOptions } from "../../shared/types.js";
import type { WorkspaceWithMembership } from "@inneropen/marvin-sdk/platform";

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
        credentialsManager.setActiveWorkspace(workspace.slug);

        console.log(`✓ Active workspace set to: ${workspace.name} (${workspace.slug})`);
      } catch (error) {
        if (error instanceof Error && error.message.includes('not found')) {
          console.error(error.message);
          console.log("\nTry: marvin workspace list");
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

        workspaces.forEach((w: WorkspaceWithMembership) => {
          const active = w.isActive ? "✓ ACTIVE" : "";
          const hasSiteToken = credentialsManager.getSiteToken(w.workspace.slug) ? "🔑" : "";
          console.log(`${w.workspace.name} (${w.workspace.slug}) ${hasSiteToken}`);
          console.log(`  Role: ${w.role}  ${active}`);
          console.log(`  ID: ${w.workspace.id}`);
          console.log();
        });

      } catch (error) {
        console.error(error instanceof Error ? error.message : error);
        process.exitCode = 1;
      }
    });

  // Set site token for workspace
  workspace
    .command("token <site-token>")
    .description("Store site token for current workspace (for Publishing API)")
    .option("--for <slug>", "Workspace slug (defaults to active workspace)")
    .action(async (siteToken: string, cmdOpts: { for?: string }) => {
      try {
        // Resolve workspace (use --for option or active workspace)
        const workspaceSlug = cmdOpts.for || credentialsManager.getActiveWorkspace();

        if (!workspaceSlug) {
          console.error("No active workspace set.");
          console.log("Either:");
          console.log("  1. Set active workspace: marvin workspace use <slug>");
          console.log("  2. Specify workspace: marvin workspace token <token> --for <slug>");
          process.exitCode = 1;
          return;
        }

        // Save the token
        credentialsManager.setSiteToken(workspaceSlug, siteToken);

        console.log(`✓ Site token saved for workspace: ${workspaceSlug}`);
        console.log("\nYou can now use Publishing API commands without --site-token flag:");
        console.log("  marvin publish entries");
        console.log("  marvin publish collections");
      } catch (error) {
        console.error(error instanceof Error ? error.message : error);
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
          console.log(`No site token stored for workspace: ${workspaceSlug}`);
          return;
        }

        // Remove the token
        credentialsManager.removeSiteToken(workspaceSlug);
        console.log(`✓ Site token removed for workspace: ${workspaceSlug}`);
      } catch (error) {
        console.error(error instanceof Error ? error.message : error);
        process.exitCode = 1;
      }
    });
}
