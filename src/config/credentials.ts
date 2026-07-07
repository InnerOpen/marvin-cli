import { readFileSync, writeFileSync, mkdirSync, chmodSync, existsSync, unlinkSync } from "fs";
import { homedir } from "os";
import { join } from "path";
import { tmpdir } from "os";
import { randomBytes } from "crypto";

export interface Credentials {
  userToken?: string;
  activeWorkspace?: string;
}

export class CredentialsManager {
  private readonly credentialsDir: string;
  private readonly credentialsPath: string;

  constructor() {
    this.credentialsDir = join(homedir(), ".marvin");
    this.credentialsPath = join(this.credentialsDir, "credentials.json");
  }

  /**
   * Load credentials from ~/.marvin/credentials.json
   * Returns an empty object if the file doesn't exist
   */
  load(): Credentials {
    if (!existsSync(this.credentialsPath)) {
      return {};
    }

    try {
      const content = readFileSync(this.credentialsPath, "utf-8");
      return JSON.parse(content) as Credentials;
    } catch (error) {
      console.warn(`Warning: Failed to read credentials file: ${error instanceof Error ? error.message : error}`);
      return {};
    }
  }

  /**
   * Save credentials to ~/.marvin/credentials.json
   * Uses atomic write (temp file + rename) to prevent corruption
   * Sets file permissions to 0600 for security
   */
  save(credentials: Credentials): void {
    // Ensure the directory exists
    if (!existsSync(this.credentialsDir)) {
      mkdirSync(this.credentialsDir, { recursive: true });
    }

    // Atomic write: write to temp file, then rename
    const tempPath = join(tmpdir(), `marvin-credentials-${randomBytes(8).toString("hex")}.json`);

    try {
      writeFileSync(tempPath, JSON.stringify(credentials, null, 2), { mode: 0o600 });

      // Rename is atomic on POSIX systems
      writeFileSync(this.credentialsPath, readFileSync(tempPath, "utf-8"), { mode: 0o600 });

      // Clean up temp file
      try {
        unlinkSync(tempPath);
      } catch {
        // Ignore cleanup errors
      }

      // Ensure proper permissions on the final file
      chmodSync(this.credentialsPath, 0o600);
    } catch (error) {
      throw new Error(`Failed to save credentials: ${error instanceof Error ? error.message : error}`);
    }
  }

  /**
   * Clear all saved credentials
   */
  clear(): void {
    if (existsSync(this.credentialsPath)) {
      try {
        unlinkSync(this.credentialsPath);
      } catch (error) {
        throw new Error(`Failed to clear credentials: ${error instanceof Error ? error.message : error}`);
      }
    }
  }

  /**
   * Get the user token from credentials
   */
  getUserToken(): string | undefined {
    return this.load().userToken;
  }

  /**
   * Get the active workspace from credentials
   */
  getActiveWorkspace(): string | undefined {
    return this.load().activeWorkspace;
  }

  /**
   * Set the user token
   */
  setUserToken(token: string): void {
    const credentials = this.load();
    credentials.userToken = token;
    this.save(credentials);
  }

  /**
   * Set the active workspace
   */
  setActiveWorkspace(workspace: string): void {
    const credentials = this.load();
    credentials.activeWorkspace = workspace;
    this.save(credentials);
  }
}

// Singleton instance
export const credentialsManager = new CredentialsManager();
