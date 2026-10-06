/**
 * JSON request bodies for write commands.
 *
 * A command that takes a body registers `--data` (and `--file`) with {@link addDataOptions} and
 * reads it with {@link readJsonInput}. Accepted forms:
 * - `--data '{"key":"value"}'`  inline JSON
 * - `--data @path/to/file.json` read a file (`--file path` is the same thing)
 * - `--data -` / `--file -`     read stdin explicitly
 * - piped stdin with no flag     `echo '{...}' | marvin … create`
 *
 * `--json <payload>` was the old spelling. It collided with the global `--json` output switch,
 * so it is rewritten to `--data` before parsing (with a warning) until it is removed in 4.0 —
 * see {@link rewriteDeprecatedJsonPayload}.
 */

import type { Command } from "commander";
import { warn } from "./io.js";

/** Register `--data <json|@file|->` and `--file <path>` on a write command. */
export function addDataOptions(cmd: Command, what: string): Command {
  return cmd
    .option("--data <json|@file|->", `${what} as JSON, @path to read a file, or - for stdin`)
    .option("--file <path>", `Path to a JSON file with ${what} (same as --data @path; - for stdin)`);
}

/** True when `cmd` takes a request body via `--data`. */
export function acceptsData(cmd: Command): boolean {
  return cmd.options.some((o) => o.long === "--data");
}

function parseJson(text: string, source: string): any {
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error(`${source} is not valid JSON: ${(error as Error).message}`);
  }
}

async function readFileSource(path: string): Promise<string> {
  if (path === "-") return readStdin();
  const { validateFilePath } = await import("./validation.js");
  const validPath = validateFilePath(path, { mustExist: true, mustBeFile: true, warnSensitive: true });
  const { readFileSync } = await import("fs");
  return readFileSync(validPath, "utf-8");
}

/**
 * Read the request body from --data, --file or piped stdin.
 * `validateObject` (default true) rejects arrays and primitives.
 */
export async function readJsonInput(cmdOpts: any, options?: { validateObject?: boolean }): Promise<any> {
  const { validateObject = true } = options || {};

  let data: any;
  const source: string | undefined = cmdOpts.data;

  if (source !== undefined) {
    if (source === "-") {
      data = parseJson(await readStdin(), "stdin");
    } else if (source.startsWith("@")) {
      const path = source.slice(1);
      data = parseJson(await readFileSource(path), path === "-" ? "stdin" : path);
    } else {
      data = parseJson(source, "--data");
    }
  } else if (cmdOpts.file) {
    data = parseJson(await readFileSource(cmdOpts.file), cmdOpts.file === "-" ? "stdin" : cmdOpts.file);
  } else if (!process.stdin.isTTY) {
    const input = await readStdin();
    if (!input.trim()) throw new Error("Provide data via --data, --file, or stdin");
    data = parseJson(input, "stdin");
  } else {
    throw new Error("Provide data via --data, --file, or stdin");
  }

  if (validateObject) {
    const { validateJsonObject } = await import("./validation.js");
    validateJsonObject(data, "input");
  }

  return data;
}

/**
 * Parse a JSON option that isn't the request body (`--rules`, `--smart-rules`, `--params`): inline
 * JSON, `@path` to read a file, or `-` for stdin. `flag` names the option in error messages.
 */
export async function readJsonArg(value: string, flag: string): Promise<any> {
  if (value === "-") return parseJson(await readStdin(), "stdin");
  if (value.startsWith("@")) {
    const path = value.slice(1);
    return parseJson(await readFileSource(path), path === "-" ? "stdin" : path);
  }
  return parseJson(value, flag);
}

async function readStdin(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk as Buffer);
  }
  return Buffer.concat(chunks).toString("utf-8");
}

/** Global options that take a value, so the walk below doesn't mistake the value for a command. */
const GLOBAL_VALUE_OPTIONS = new Set(["--api-url", "--workspace", "--output"]);

function looksLikeJsonPayload(value: string | undefined): boolean {
  if (value === undefined) return false;
  const head = value.trimStart()[0];
  return head === "{" || head === "[";
}

export const JSON_PAYLOAD_DEPRECATION =
  "--json <payload> is deprecated and will be removed in 4.0; use --data <json|@file|-> instead. " +
  "(--json on its own still selects JSON output.)";

/**
 * Rewrite the deprecated `--json <payload>` to `--data <payload>`.
 *
 * Commander gives the root's boolean `--json` (output format) priority wherever it appears, so a
 * subcommand's `--json <payload>` never received its value. Here, for a command that accepts
 * `--data`, a `--json` followed by a JSON object or array (`{…}` / `[…]`) is taken as the old
 * payload flag: it's rewritten to `--data` and a deprecation warning goes to stderr. Anything
 * else — `--json` at the end, before another flag, before an id — is left alone and still means
 * "output JSON". The result doesn't force JSON output.
 *
 * Returns a new argv; the input is not modified.
 */
export function rewriteDeprecatedJsonPayload(program: Command, argv: string[]): string[] {
  const out = [...argv];
  let cmd = program;

  // Walk to the leaf command named on the command line.
  for (let i = 2; i < out.length; i++) {
    const token = out[i]!;
    if (token === "--") break;
    if (token.startsWith("-")) {
      if (GLOBAL_VALUE_OPTIONS.has(token)) i++;
      continue;
    }
    const sub = cmd.commands.find((c) => c.name() === token || c.aliases().includes(token));
    if (sub) cmd = sub;
  }

  if (!acceptsData(cmd)) return out;

  let rewrote = false;
  for (let i = 2; i < out.length; i++) {
    const token = out[i]!;
    if (token === "--") break;
    if (token === "--json" && looksLikeJsonPayload(out[i + 1])) {
      out[i] = "--data";
      rewrote = true;
      i++;
    } else if (token.startsWith("--json=") && looksLikeJsonPayload(token.slice("--json=".length))) {
      out[i] = `--data=${token.slice("--json=".length)}`;
      rewrote = true;
    }
  }

  if (rewrote) warn(JSON_PAYLOAD_DEPRECATION);
  return out;
}
