import { Command } from "commander";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { getOutputMode, type CommonCommandOptions } from "../../shared/types.js";
import { renderData } from "../../output.js";

export function registerVersionCommands(parent: Command): void {
  parent
    .command("version")
    .description("Show CLI version")
    .action(function(this: Command) {
      try {
        const __dirname = dirname(fileURLToPath(import.meta.url));
        const packageJson = JSON.parse(readFileSync(join(__dirname, "../../../package.json"), "utf-8"));
        const mode = getOutputMode(this.optsWithGlobals<CommonCommandOptions>());
        if (mode === "table") process.stdout.write(`Marvin CLI v${packageJson.version}\n`);
        else renderData({ version: packageJson.version }, mode);
      } catch (error) {
        console.error("Error reading version:", error instanceof Error ? error.message : error);
        process.exitCode = 1;
      }
    });
}
