import { Command } from "commander";
import { registerHealthCommands } from "./health.js";
import { registerVersionCommands } from "./version.js";

/**
 * Create the 'system' command group
 * Utility commands for CLI and API health checks
 */
export function createSystemCommand(): Command {
  const system = new Command("system")
    .description("System utility commands");

  // Register subcommands
  registerHealthCommands(system);
  registerVersionCommands(system);

  return system;
}
