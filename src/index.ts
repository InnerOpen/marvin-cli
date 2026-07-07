#!/usr/bin/env node
import "dotenv/config";
import { Command } from "commander";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { createPublishCommand } from "./commands/publish/index.js";
import { createPlatformCommand } from "./commands/platform/index.js";
import { createSystemCommand } from "./commands/system/index.js";

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

// Register command groups
program.addCommand(createPublishCommand());
program.addCommand(createPlatformCommand());
program.addCommand(createSystemCommand());

// Backward compatibility - root-level aliases for Publishing API commands
// These allow users to run `marvin entries` instead of `marvin publish entries`
const publishCmd = createPublishCommand();
publishCmd.commands.forEach((cmd) => {
  const aliasCmd = new Command(cmd.name())
    .description(`${cmd.description()} (alias for 'marvin publish ${cmd.name()}')`)
    .allowUnknownOption(true)
    .action((...args) => {
      // Re-parse with the publish command prefix
      const argv = process.argv.slice(0, 2).concat(['publish', cmd.name()]).concat(process.argv.slice(3));
      program.parse(argv);
    });

  // Copy options from the original command
  cmd.options.forEach(opt => aliasCmd.addOption(opt));

  program.addCommand(aliasCmd);
});

// Add --token as an alias for --site-token at the root level (backward compat)
program.option("--token <token>", "Site client token (alias for --site-token in publish commands)");

program.parse();
