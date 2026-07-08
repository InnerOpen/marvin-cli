/**
 * Read JSON data from --json, --file, or stdin (pipe/heredoc)
 *
 * Supports:
 * - --json '{"key":"value"}'
 * - --file path/to/file.json
 * - --file - (explicit stdin)
 * - echo '{"key":"value"}' | command
 * - command <<'EOF' ... EOF
 */
export async function readJsonInput(cmdOpts: any): Promise<any> {
  if (cmdOpts.json) {
    return JSON.parse(cmdOpts.json);
  } else if (cmdOpts.file) {
    if (cmdOpts.file === "-") {
      // Explicit stdin via --file -
      return await readStdin();
    } else {
      // Read from file
      const { readFileSync } = await import("fs");
      return JSON.parse(readFileSync(cmdOpts.file, "utf-8"));
    }
  } else {
    // Check if stdin has data (pipe or heredoc)
    if (!process.stdin.isTTY) {
      const input = await readStdin();
      if (input.trim()) {
        return JSON.parse(input);
      }
    }
    throw new Error("Provide data via --json, --file, or stdin");
  }
}

async function readStdin(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk as Buffer);
  }
  return Buffer.concat(chunks).toString("utf-8");
}
