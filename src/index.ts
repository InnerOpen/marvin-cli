#!/usr/bin/env node
import "dotenv/config";
import { Command } from "commander";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { createPublishCommand } from "./commands/publish/index.js";
import { createPlatformCommand } from "./commands/platform/index.js";
import { createSystemCommand } from "./commands/system/index.js";
import { createAdminCommand } from "./commands/admin/index.js";
import { createUserCommand } from "./commands/user/index.js";
import { registerAuthCommands } from "./commands/auth.js";
import { registerWorkspaceCommands } from "./commands/platform/workspaces.js";
import { credentialsManager } from "./config/credentials.js";
import { env } from "./config/environment.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const packageJson = JSON.parse(readFileSync(join(__dirname, "../package.json"), "utf-8"));

// Resolve auth state from env vars + stored credentials
const activeWorkspace = credentialsManager.getActiveWorkspace() || env.workspaceSlug;
const hasSiteToken = !!(
  env.siteClientToken ||
  (activeWorkspace && credentialsManager.getSiteToken(activeWorkspace))
);
const hasUserToken = !!(env.userToken || credentialsManager.getUserToken());

function buildAuthStatus(): string {
  if (hasUserToken && hasSiteToken) {
    const ws = activeWorkspace ? ` · ${activeWorkspace}` : "";
    return `  Authenticated: full access (user + publish${ws})`;
  }
  if (hasUserToken) {
    return `  Authenticated: platform access · run 'marvin login --site-token <token> --workspace <slug>' to add publish access`;
  }
  if (hasSiteToken) {
    const ws = activeWorkspace ? ` · ${activeWorkspace}` : "";
    return `  Authenticated: publish access only${ws} · run 'marvin login' to add platform access`;
  }
  return `  Not authenticated — run 'marvin login' to get started`;
}

const program = new Command();

program
  .name("marvin")
  .description("Official CLI for Marvin CMS")
  .version(packageJson.version)
  .option("--api-url <url>", "Marvin API URL, overrides MARVIN_API_URL")
  .option("--workspace <slug>", "Workspace slug, overrides MARVIN_WORKSPACE_SLUG")
  .option("--output <format>", "Output format: table, json, yaml, csv", "table")
  .option("--json", "Shortcut for --output json", false)
  .option("--yaml", "Shortcut for --output yaml", false)
  .option("--csv", "Shortcut for --output csv", false);

program.addHelpText("before", `\n${buildAuthStatus()}\n`);

// Auth always visible
registerAuthCommands(program);

// Workspace requires platform access — hidden when no user token
// (workspace slug can be passed via --workspace flag or MARVIN_WORKSPACE_SLUG env var)
registerWorkspaceCommands(program, { hidden: !hasUserToken });

// Publish: only shown when a site token is available
program.addCommand(createPublishCommand(), { hidden: !hasSiteToken });

// Platform / admin / user: only shown when a user token is available
program.addCommand(createPlatformCommand(), { hidden: !hasUserToken });
program.addCommand(createAdminCommand(), { hidden: !hasUserToken });
program.addCommand(createUserCommand(), { hidden: !hasUserToken });

// System (health, version) — always visible, no auth required
program.addCommand(createSystemCommand());

program.parse();
