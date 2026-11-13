/**
 * The inputs of a workflow run, given on the command line: `--input name=value`, repeated. A value that starts with `@` is read from that file
 * (`--input text=@draft.fountain`), `@-` from standard input, so a long text needs no quoting.
 */

import { readFileSync } from "node:fs";

/** commander's collector for a repeatable option. */
export function collect(value: string, previous: string[]): string[] {
  return [...previous, value];
}

function readText(path: string): string {
  return readFileSync(path === "-" ? 0 : path, "utf8");
}

/** `["text=@draft.fountain", "mode=add"]` -> `{ text: "<the file>", mode: "add" }`. A name given twice is a mistake, not a choice. */
export function parseRunInputs(pairs: string[] | undefined, read: (path: string) => string = readText): Record<string, string> {
  const out: Record<string, string> = {};
  for (const pair of pairs ?? []) {
    const at = pair.indexOf("=");
    const name = at > 0 ? pair.slice(0, at).trim() : "";
    if (!name) throw new Error(`--input needs name=value (got "${pair}")`);
    if (name in out) throw new Error(`--input ${name} is given twice`);
    const value = pair.slice(at + 1);
    out[name] = value.startsWith("@") ? read(value.slice(1)) : value;
  }
  return out;
}
