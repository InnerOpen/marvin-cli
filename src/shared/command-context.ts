/**
 * Remembers which command is running, so shared code (the error handler) can say what the
 * user was trying to do without every action passing it along.
 */

import type { Command } from "commander";
import { credentialsManager } from "../config/credentials.js";
import { env } from "../config/environment.js";
import type { OutputMode } from "../output.js";

export interface CommandContext {
  /** Space-separated command path without the program name, e.g. "platform entry-types create". */
  path: string;
  /** Workspace the command targets: --workspace, else the active workspace, else MARVIN_WORKSPACE_SLUG. */
  workspace?: string;
  /** Output format from --output/--json/--yaml/--csv; undefined when the value was invalid. */
  outputMode?: OutputMode;
}

const OUTPUT_MODES: readonly OutputMode[] = ["table", "json", "yaml", "csv"];

function outputModeOf(opts: { output?: string; json?: boolean; yaml?: boolean; csv?: boolean }): OutputMode | undefined {
  if (opts.json === true) return "json";
  if (opts.yaml === true) return "yaml";
  if (opts.csv === true) return "csv";
  const value = String(opts.output ?? "table").toLowerCase() as OutputMode;
  return OUTPUT_MODES.includes(value) ? value : undefined;
}

let current: CommandContext | undefined;

/** The full command path of `cmd`, without the root program's name. */
export function commandPath(cmd: Command): string {
  const names: string[] = [];
  for (let c: Command | null = cmd; c?.parent; c = c.parent) {
    names.unshift(c.name());
  }
  return names.join(" ");
}

export function setCommandContext(cmd: Command): void {
  const opts = cmd.optsWithGlobals<{ workspace?: string; output?: string; json?: boolean; yaml?: boolean; csv?: boolean }>();
  current = {
    path: commandPath(cmd),
    workspace: opts.workspace || credentialsManager.getActiveWorkspace() || env.workspaceSlug,
    outputMode: outputModeOf(opts),
  };
}

/** Forget the running command (tests run many commands in one process). */
export function resetCommandContext(): void {
  current = undefined;
}

export function getCommandContext(): CommandContext | undefined {
  return current;
}

/** Record the running command before every action under `program`. */
export function trackCommandContext(program: Command): void {
  program.hook("preAction", (_thisCommand, actionCommand) => setCommandContext(actionCommand));
}
