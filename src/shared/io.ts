/**
 * Where CLI output goes.
 *
 * stdout carries data only — what `--output json | jq` reads. Everything meant for a person
 * (✓ confirmations, progress, warnings, hints) goes to stderr, so it shows in a terminal but
 * never corrupts a pipe.
 */

import chalk from "chalk";
import { renderData, type OutputMode } from "../output.js";

/** A human message: stderr, one line. */
export function say(message = ""): void {
  process.stderr.write(`${message}\n`);
}

/** A warning: stderr, prefixed so it stands out in CI logs. */
export function warn(message: string): void {
  process.stderr.write(`${chalk.yellow("warning:")} ${message}\n`);
}

/**
 * The result of a delete/remove/revoke. Machine modes get `{"deleted": "<id>"}` on stdout so a
 * script can confirm what went; table mode gets the prose line on stderr.
 */
export function emitDeleted(id: string, mode: OutputMode, message: string): void {
  if (mode === "table") {
    say(message);
    return;
  }
  renderData({ deleted: id }, mode);
}

/**
 * The result of a run/test/rerun/import (an action, not a resource). Machine modes get
 * `{"ok": true, ...details}` on stdout; table mode gets the prose lines on stderr.
 */
export function emitOk(details: object | null | undefined, mode: OutputMode, ...lines: string[]): void {
  if (mode === "table") {
    for (const line of lines) say(line);
    return;
  }
  renderData({ ok: true, ...(details ?? {}) }, mode);
}
