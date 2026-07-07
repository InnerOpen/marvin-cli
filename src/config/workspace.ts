import { env } from "./environment.js";
import { credentialsManager } from "./credentials.js";

/**
 * Workspace resolution logic
 * Used for Platform API only (Publishing always requires explicit workspace)
 */
export class WorkspaceResolver {
  /**
   * Resolve workspace slug with precedence:
   * 1. CLI flag (if provided)
   * 2. MARVIN_WORKSPACE_SLUG environment variable
   * 3. Saved active workspace from credentials
   *
   * @param cliFlag - Workspace slug from CLI --workspace flag
   * @returns Resolved workspace slug or undefined
   */
  async resolve(cliFlag?: string): Promise<string | undefined> {
    // Precedence 1: CLI flag
    if (cliFlag) {
      return cliFlag;
    }

    // Precedence 2: Environment variable
    const envWorkspace = env.workspaceSlug;
    if (envWorkspace) {
      return envWorkspace;
    }

    // Precedence 3: Saved credentials
    const savedWorkspace = credentialsManager.getActiveWorkspace();
    if (savedWorkspace) {
      return savedWorkspace;
    }

    // No workspace found
    return undefined;
  }
}

// Singleton instance
export const workspaceResolver = new WorkspaceResolver();
