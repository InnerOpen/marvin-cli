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

const __dirname = dirname(fileURLToPath(import.meta.url));
const packageJson = JSON.parse(readFileSync(join(__dirname, "../package.json"), "utf-8"));

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

// Register auth commands at root level
registerAuthCommands(program);

// Register workspace commands at root level (moved from platform)
registerWorkspaceCommands(program);

// Register command groups
program.addCommand(createPublishCommand());
program.addCommand(createPlatformCommand());
program.addCommand(createAdminCommand());
program.addCommand(createSystemCommand());
program.addCommand(createUserCommand());

program.parse();
