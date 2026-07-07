import { Command } from "commander";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

export function registerVersionCommands(parent: Command): void {
  parent
    .command("version")
    .description("Show CLI version")
    .action(() => {
      try {
        const __dirname = dirname(fileURLToPath(import.meta.url));
        const packageJson = JSON.parse(readFileSync(join(__dirname, "../../../package.json"), "utf-8"));
        console.log(`Marvin CLI v${packageJson.version}`);
      } catch (error) {
        console.error("Error reading version:", error instanceof Error ? error.message : error);
        process.exitCode = 1;
      }
    });
}
