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
export async function readJsonInput(cmdOpts: any, options?: { validateObject?: boolean }): Promise<any> {
  const { validateObject = true } = options || {};

  let data: any;

  if (cmdOpts.json) {
    data = JSON.parse(cmdOpts.json);
  } else if (cmdOpts.file) {
    if (cmdOpts.file === "-") {
      // Explicit stdin via --file -
      const input = await readStdin();
      data = JSON.parse(input);
    } else {
      // Validate and read from file
      const { validateFilePath } = await import("./validation.js");
      const validPath = validateFilePath(cmdOpts.file, {
        mustExist: true,
        mustBeFile: true,
        warnSensitive: true,
      });

      const { readFileSync } = await import("fs");
      data = JSON.parse(readFileSync(validPath, "utf-8"));
    }
  } else {
    // Check if stdin has data (pipe or heredoc)
    if (!process.stdin.isTTY) {
      const input = await readStdin();
      if (input.trim()) {
        data = JSON.parse(input);
      } else {
        throw new Error("Provide data via --json, --file, or stdin");
      }
    } else {
      throw new Error("Provide data via --json, --file, or stdin");
    }
  }

  // Validate that data is an object (not array or primitive)
  if (validateObject) {
    const { validateJsonObject } = await import("./validation.js");
    validateJsonObject(data, "input");
  }

  return data;
}

async function readStdin(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk as Buffer);
  }
  return Buffer.concat(chunks).toString("utf-8");
}
