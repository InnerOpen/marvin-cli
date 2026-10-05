import { handleCommandError } from '../../shared/error-handler.js';
import { Command } from "commander";
import { PlatformClient } from "@inneropen/marvin-sdk/platform";
import { env } from "../../config/environment.js";
import { getOutputMode, type CommonCommandOptions } from "../../shared/types.js";
import { renderData } from "../../output.js";
import { say } from "../../shared/io.js";

export function registerHealthCommands(parent: Command): void {
  parent
    .command("health")
    .description("Check Marvin API health")
    .action(async function(this: Command) {
      try {
        const opts = this.optsWithGlobals<CommonCommandOptions>();
        const apiUrl = opts.apiUrl || env.apiUrl;

        if (!apiUrl) {
          console.error("Error: MARVIN_API_URL is required (set via --api-url or MARVIN_API_URL env var)");
          process.exitCode = 1;
          return;
        }

        // Health is a public endpoint — no token required
        const client = new PlatformClient({ apiUrl });
        const data = await client.app.health();

        const mode = getOutputMode(opts);
        if (mode === "table") {
          say(`✓ API is healthy`);
          say(`  URL: ${apiUrl}`);
          if (data) renderData(data, mode);
        } else {
          renderData({ healthy: true, url: apiUrl, response: data ?? null }, mode);
        }
      } catch (error) {
        console.error(`✗ Failed to reach API`);
        handleCommandError(error);
        process.exitCode = 1;
      }
    });
}
