import { readFileSync, writeFileSync, mkdirSync, chmodSync, existsSync, unlinkSync, renameSync } from "fs";
import { homedir } from "os";
import { join } from "path";
import { randomBytes } from "crypto";

export interface WorkspaceCredentials {
  siteToken?: string;
}

export interface Credentials {
  apiUrl?: string;
  userToken?: string;
  activeWorkspace?: string;
  workspaces?: Record<string, WorkspaceCredentials>;
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
    // Ensure the directory exists with secure permissions
    if (!existsSync(this.credentialsDir)) {
      mkdirSync(this.credentialsDir, { recursive: true, mode: 0o700 });
    }

    // Atomic write: write to temp file in same directory, then rename
    // Note: temp file MUST be in same directory for atomic rename to work on all filesystems
    const tempPath = join(this.credentialsDir, `.credentials-${randomBytes(8).toString("hex")}.tmp`);

    try {
      // Write to temp file with secure permissions
      writeFileSync(tempPath, JSON.stringify(credentials, null, 2), { mode: 0o600 });

      // Atomic rename (only works within same filesystem)
      // This is truly atomic on POSIX systems - either completes fully or not at all
      renameSync(tempPath, this.credentialsPath);

      // Ensure proper permissions on the final file (renameSync preserves permissions)
      chmodSync(this.credentialsPath, 0o600);
    } catch (error) {
      // Clean up temp file on error
      try {
        if (existsSync(tempPath)) {
          unlinkSync(tempPath);
        }
      } catch {
        // Ignore cleanup errors
      }

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

  /**
   * Get the saved API URL
   */
  getApiUrl(): string | undefined {
    return this.load().apiUrl;
  }

  /**
   * Save the API URL
   */
  setApiUrl(apiUrl: string): void {
    const credentials = this.load();
    credentials.apiUrl = apiUrl;
    this.save(credentials);
  }

  /**
   * Get the site token for a specific workspace
   */
  getSiteToken(workspace: string): string | undefined {
    const credentials = this.load();
    return credentials.workspaces?.[workspace]?.siteToken;
  }

  /**
   * Set the site token for a specific workspace
   */
  setSiteToken(workspace: string, token: string): void {
    const credentials = this.load();

    // Initialize workspaces object if it doesn't exist
    if (!credentials.workspaces) {
      credentials.workspaces = {};
    }

    // Initialize workspace credentials if it doesn't exist
    if (!credentials.workspaces[workspace]) {
      credentials.workspaces[workspace] = {};
    }

    credentials.workspaces[workspace].siteToken = token;
    this.save(credentials);
  }

  /**
   * Remove site token for a specific workspace
   */
  removeSiteToken(workspace: string): void {
    const credentials = this.load();

    if (credentials.workspaces?.[workspace]) {
      delete credentials.workspaces[workspace].siteToken;

      // Clean up empty workspace entries
      if (Object.keys(credentials.workspaces[workspace]).length === 0) {
        delete credentials.workspaces[workspace];
      }

      this.save(credentials);
    }
  }
}

// Singleton instance
export const credentialsManager = new CredentialsManager();
