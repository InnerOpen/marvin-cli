/**
 * Secure input prompting utilities
 * Handles password and token input without exposing values in shell history
 */

import * as readline from "readline";

export interface PromptOptions {
  message: string;
  hidden?: boolean;
  default?: string;
}

/**
 * Prompt for secure input (passwords, tokens) with hidden input
 */
export function promptSecure(message: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    // Disable echo for password-like input
    const stdin = process.stdin as any;
    const isTTY = stdin.isTTY;

    if (isTTY) {
      stdin.setRawMode(true);
    }

    let input = "";
    console.log(message);

    const cleanup = () => {
      if (isTTY) {
        stdin.setRawMode(false);
      }
      rl.close();
    };

    process.stdin.on("data", (char) => {
      const key = char.toString();

      if (key === "\n" || key === "\r" || key === "") {
        // Enter or Ctrl+D
        console.log(); // New line after input
        cleanup();
        resolve(input);
      } else if (key === "") {
        // Ctrl+C
        console.log("\nCancelled");
        cleanup();
        process.exitCode = 1;
        resolve("");
      } else if (key === "" || key === "\b") {
        // Backspace
        if (input.length > 0) {
          input = input.slice(0, -1);
        }
      } else {
        input += key;
      }
    });
  });
}

/**
 * Prompt for visible input (non-sensitive)
 */
export function prompt(message: string, defaultValue?: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const promptText = defaultValue
      ? `${message} [${defaultValue}]: `
      : `${message}: `;

    rl.question(promptText, (answer) => {
      rl.close();
      resolve(answer.trim() || defaultValue || "");
    });
  });
}

/**
 * Prompt for password with confirmation
 */
export async function promptPassword(message: string = "Enter password"): Promise<string> {
  const password = await promptSecure(message + " (input hidden):");

  if (!password) {
    throw new Error("Password is required");
  }

  const confirm = await promptSecure("Confirm password (input hidden):");

  if (password !== confirm) {
    throw new Error("Passwords do not match");
  }

  return password;
}

/**
 * Read token from stdin (for piped input)
 */
export async function readFromStdin(): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = "";

    if (process.stdin.isTTY) {
      reject(new Error("stdin is a TTY, expected piped input"));
      return;
    }

    process.stdin.setEncoding("utf8");

    process.stdin.on("data", (chunk) => {
      data += chunk;
    });

    process.stdin.on("end", () => {
      resolve(data.trim());
    });

    process.stdin.on("error", (err) => {
      reject(err);
    });
  });
}
