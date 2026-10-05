/**
 * Remembers which command is running, so shared code (the error handler) can say what the
 * user was trying to do without every action passing it along.
 */

import type { Command } from "commander";
import { credentialsManager } from "../config/credentials.js";
import { env } from "../config/environment.js";

export interface CommandContext {
  /** Space-separated command path without the program name, e.g. "platform entry-types create". */
  path: string;
  /** Workspace the command targets: --workspace, else the active workspace, else MARVIN_WORKSPACE_SLUG. */
  workspace?: string;
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
  const opts = cmd.optsWithGlobals<{ workspace?: string }>();
  current = {
    path: commandPath(cmd),
    workspace: opts.workspace || credentialsManager.getActiveWorkspace() || env.workspaceSlug,
  };
}

export function getCommandContext(): CommandContext | undefined {
  return current;
}

/** Record the running command before every action under `program`. */
export function trackCommandContext(program: Command): void {
  program.hook("preAction", (_thisCommand, actionCommand) => setCommandContext(actionCommand));
}
