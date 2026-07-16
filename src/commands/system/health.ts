import { Command } from "commander";
import { PlatformClient } from "@inneropen/marvin-sdk/platform";
import { env } from "../../config/environment.js";
import type { CommonCommandOptions } from "../../shared/types.js";

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

        console.log(`✓ API is healthy`);
        console.log(`  URL: ${apiUrl}`);
        if (data) {
          console.log(`  Response:`, data);
        }
      } catch (error) {
        console.error(`✗ Failed to reach API`);
        console.error(error instanceof Error ? error.message : error);
        process.exitCode = 1;
      }
    });
}
