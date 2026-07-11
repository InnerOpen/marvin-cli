import type { OutputMode } from "../output.js";

/**
 * Common options for all CLI commands
 */
export interface CommonCommandOptions {
  apiUrl?: string;
  workspace?: string;
  output?: string;
  json?: boolean;
  yaml?: boolean;
  csv?: boolean;
}

/**
 * Options for Publishing API commands
 * Uses site client token for authentication
 */
export interface PublishCommandOptions extends CommonCommandOptions {
  token?: string; // Site client token (--token or --site-token)
}

/**
 * Options for Platform API commands
 * Uses user token for authentication
 *
 * Note: userToken is NOT supported as a CLI flag for security reasons
 * (would expose token in shell history). Use environment variable
 * MARVIN_USER_TOKEN or save via 'marvin login' instead.
 */
export interface PlatformCommandOptions extends CommonCommandOptions {
  // userToken is intentionally not part of CLI options
  // It's resolved from: env.userToken || credentialsManager.getUserToken()
}

/**
 * Helper to determine output mode from command options
 */
export function getOutputMode(opts: CommonCommandOptions): OutputMode {
  if (opts.json) return "json";
  if (opts.yaml) return "yaml";
  if (opts.csv) return "csv";

  const value = String(opts.output ?? "table").toLowerCase();
  if (["table", "json", "yaml", "csv"].includes(value)) {
    return value as OutputMode;
  }

  console.error(`Unsupported output format: ${value}. Use table, json, yaml, or csv.`);
  process.exitCode = 1;
  throw new Error(`Unsupported output format: ${value}`);
}
