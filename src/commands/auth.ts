import { Command } from "commander";
import { credentialsManager } from "../config/credentials.js";
import { env } from "../config/environment.js";
import * as readline from "readline";
import { handleCommandError } from "../shared/error-handler.js";

/**
 * Prompt for user token input (hides input)
 */
function promptForToken(): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    // Disable echo for password-like input
    const stdin = process.stdin as any;
    if (stdin.isTTY) {
      stdin.setRawMode(true);
    }

    let token = "";
    console.log("Enter user token (input hidden):");

    process.stdin.on("data", (char) => {
      const key = char.toString();

      if (key === "\n" || key === "\r" || key === "") {
        // Enter or Ctrl+D
        console.log(); // New line after input
        if (stdin.isTTY) {
          stdin.setRawMode(false);
        }
        rl.close();
        resolve(token);
      } else if (key === "") {
        // Ctrl+C
        console.log("\nCancelled");
        process.exit(0);
      } else if (key === "" || key === "\b") {
        // Backspace
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
  // Login command
  parent
    .command("login")
    .description("Authenticate with Marvin and save credentials")
    .option("--user-token <token>", "User token (if not provided, will prompt)")
    .option("--workspace <slug>", "Set active workspace after login")
    .action(async function(this: Command, cmdOpts) {
      try {
        // Get token from: flag > env > prompt
        let userToken = cmdOpts.userToken || env.userToken;

        if (!userToken) {
          userToken = await promptForToken();
        }

        if (!userToken || userToken.trim() === "") {
          console.error("Error: User token is required");
          process.exitCode = 1;
          return;
        }

        // Save credentials
        credentialsManager.setUserToken(userToken);

        // Set active workspace if provided
        if (cmdOpts.workspace) {
          credentialsManager.setActiveWorkspace(cmdOpts.workspace);
          console.log(`✓ Logged in successfully`);
          console.log(`✓ Active workspace set to: ${cmdOpts.workspace}`);
        } else {
          console.log(`✓ Logged in successfully`);
          console.log(`  Credentials saved to ~/.marvin/credentials.json`);
          console.log(`  Set active workspace with: marvin workspace use <slug>`);
        }
      } catch (error) {
        console.error(error instanceof Error ? error.message : error);
        process.exitCode = 1;
      }
    });

  // Logout command
  parent
    .command("logout")
    .description("Clear saved credentials")
    .action(async () => {
      try {
        credentialsManager.clear();
        console.log("✓ Logged out successfully");
        console.log("  Credentials cleared from ~/.marvin/credentials.json");
      } catch (error) {
        console.error(error instanceof Error ? error.message : error);
        process.exitCode = 1;
      }
    });
}
