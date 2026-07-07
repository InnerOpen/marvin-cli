import { Command } from "commander";
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

        // Make a simple health check request
        const healthUrl = new URL("/api/app/health", apiUrl).toString();
        const response = await fetch(healthUrl);

        if (response.ok) {
          const data = await response.json();
          console.log(`✓ API is healthy`);
          console.log(`  URL: ${apiUrl}`);
          console.log(`  Status: ${response.status}`);
          if (data) {
            console.log(`  Response:`, data);
          }
        } else {
          console.error(`✗ API health check failed`);
          console.error(`  URL: ${apiUrl}`);
          console.error(`  Status: ${response.status}`);
          process.exitCode = 1;
        }
      } catch (error) {
        console.error(`✗ Failed to reach API`);
        console.error(error instanceof Error ? error.message : error);
        process.exitCode = 1;
      }
    });
}
