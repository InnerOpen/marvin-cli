/**
 * Writing a downloaded file: to `--out-file`, or raw to stdout when stdout is piped (so
 * `marvin … download x > file` and `| convert …` work). A terminal never gets binary: without
 * `--out-file` and with a TTY on stdout the command refuses before downloading anything.
 */

import { writeFileSync } from "fs";
import type { BinaryResponse } from "@inneropen/marvin-sdk";
import type { OutputMode } from "../output.js";
import { emitOk } from "./io.js";

/** Throw unless there is somewhere safe to put the bytes. */
export function requireDownloadTarget(outFile: string | undefined): void {
  if (!outFile && process.stdout.isTTY) {
    throw new Error("Pass --out-file <path>, or redirect stdout (> file), to download the file");
  }
}

/**
 * Save the file. With --out-file: write it, then report `{ok, file, bytes, contentType}` (JSON
 * modes) or a ✓ line on stderr. Without: the bytes go to stdout and nothing else does.
 */
export function writeDownload(file: BinaryResponse, outFile: string | undefined, mode: OutputMode): void {
  const bytes = Buffer.from(file.data);
  if (!outFile) {
    process.stdout.write(bytes);
    return;
  }
  writeFileSync(outFile, bytes);
  emitOk({ file: outFile, bytes: bytes.length, contentType: file.contentType }, mode,
    `✓ Wrote ${bytes.length} bytes to ${outFile}${file.contentType ? ` (${file.contentType})` : ""}`);
}
