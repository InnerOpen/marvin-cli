import { Command } from "commander";
import { credentialsManager } from "../config/credentials.js";
import { env } from "../config/environment.js";
import * as readline from "readline";
import { handleCommandError } from "../shared/error-handler.js";

function promptForToken(label: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const stdin = process.stdin as any;
    if (stdin.isTTY) {
      stdin.setRawMode(true);
    }

    let token = "";
    console.log(`Enter ${label} (input hidden):`);

    process.stdin.on("data", (char) => {
      const key = char.toString();

      if (key === "\n" || key === "\r" || key === "") {
        console.log();
        if (stdin.isTTY) {
          stdin.setRawMode(false);
        }
        rl.close();
        resolve(token);
      } else if (key === "") {
        console.log("\nCancelled");
        process.exit(0);
      } else if (key === "" || key === "\b") {
        if (token.length > 0) {
          token = token.slice(0, -1);
        }
      } else {
        token += key;
      }
    });
  });
}

export function registerAuthCommands(parent: Command): void {
  parent
    .command("login")
    .description("Authenticate with Marvin and save credentials")
    .option("--user-token <token>", "User token for platform access (if not provided, will prompt)")
    .option("--site-token <token>", "Site client token for publish access")
    .option("--workspace <slug>", "Workspace slug (required when saving a site token)")
    .action(async function (this: Command, cmdOpts) {
      try {
        // Merge local + global opts so --workspace works whether passed before or after login
        const allOpts = this.optsWithGlobals<typeof cmdOpts>();
        const apiUrl = allOpts.apiUrl || env.apiUrl || credentialsManager.getApiUrl();
        if (!apiUrl) {
          console.error("Error: API URL is required. Pass --api-url <url> or set MARVIN_API_URL");
          process.exitCode = 1;
          return;
        }

        let savedAny = false;

        // --- Site token path ---
        if (allOpts.siteToken) {
          const workspace =
            allOpts.workspace ||
            credentialsManager.getActiveWorkspace() ||
            env.workspaceSlug;

          if (!workspace) {
            console.error(
              "Error: --workspace <slug> is required when saving a site token.\n" +
              "  marvin login --site-token <token> --workspace <slug>"
            );
            process.exitCode = 1;
            return;
          }

          console.log("Validating site token...");
          try {
            const { MarvinClient } = await import("@inneropen/marvin-sdk");
            const client = new MarvinClient({
              apiUrl,
              siteClientToken: allOpts.siteToken,
              workspaceSlug: workspace,
            });
            await client.collections.list();
            console.log("✓ Site token is valid");
          } catch (error) {
            console.error("✗ Site token validation failed");
            if (error instanceof Error) console.error(error.message);
            process.exitCode = 1;
            return;
          }

          credentialsManager.setApiUrl(apiUrl);
          credentialsManager.setSiteToken(workspace, allOpts.siteToken);
          if (!credentialsManager.getActiveWorkspace()) {
            credentialsManager.setActiveWorkspace(workspace);
          }
          console.log(`✓ Site token saved for workspace: ${workspace}`);
          savedAny = true;
        }

        // --- User token path ---
        const rawUserToken = allOpts.userToken || env.userToken;
        const shouldLoginUser = rawUserToken || !allOpts.siteToken;

        if (shouldLoginUser) {
          let userToken = rawUserToken;

          if (!userToken) {
            userToken = await promptForToken("user token");
          }

          if (!userToken || userToken.trim() === "") {
            console.error("Error: User token is required");
            process.exitCode = 1;
            return;
          }

          console.log("Validating user token...");
          try {
            const { PlatformClient } = await import("@inneropen/marvin-sdk/platform");
            const client = new PlatformClient({ apiUrl, userToken });
            await client.user.getProfile();
            console.log("✓ User token is valid");
          } catch (error) {
            console.error("✗ User token validation failed");
            if (error instanceof Error) console.error(error.message);
            process.exitCode = 1;
            return;
          }

          credentialsManager.setApiUrl(apiUrl);
          credentialsManager.setUserToken(userToken);

          if (allOpts.workspace) {
            credentialsManager.setActiveWorkspace(allOpts.workspace);
            console.log(`✓ Logged in successfully`);
            console.log(`✓ Active workspace set to: ${allOpts.workspace}`);
          } else {
            console.log(`✓ Logged in successfully`);
            if (!savedAny) {
              console.log(`  Credentials saved to ~/.marvin/credentials.json`);
              console.log(`  Set active workspace with: marvin workspace use <slug>`);
            }
          }
          savedAny = true;
        }

        if (!savedAny) {
          console.error("Error: Provide --user-token, --site-token, or both");
          process.exitCode = 1;
        }
      } catch (error) {
        handleCommandError(error);
      }
    });

  parent
    .command("logout")
    .description("Clear saved credentials")
    .option("--site-token", "Clear only the site token for the active workspace")
    .option("--all", "Clear all credentials (default: clears user token only)")
    .action(async function (this: Command, cmdOpts) {
      try {
        if (cmdOpts.siteToken) {
          const workspace =
            credentialsManager.getActiveWorkspace() || env.workspaceSlug;
          if (!workspace) {
            console.error("Error: No active workspace — cannot clear site token");
            process.exitCode = 1;
            return;
          }
          credentialsManager.removeSiteToken(workspace);
          console.log(`✓ Site token cleared for workspace: ${workspace}`);
        } else if (cmdOpts.all) {
          credentialsManager.clear();
          console.log("✓ All credentials cleared");
        } else {
          const creds = credentialsManager.load();
          delete creds.userToken;
          credentialsManager.save(creds);
          console.log("✓ Logged out (user token cleared)");
          console.log("  Site tokens preserved — use --site-token or --all to remove them");
        }
      } catch (error) {
        handleCommandError(error);
      }
    });
}
