import { MarvinClient, AuthClient } from "@inneropen/marvin-sdk";
import { PlatformClient } from "@inneropen/marvin-sdk/platform";
import { env } from "../config/environment.js";
import { credentialsManager } from "../config/credentials.js";
import { workspaceResolver } from "../config/workspace.js";
import { validateApiUrl } from "./validation.js";
import type { PublishCommandOptions, PlatformCommandOptions } from "./types.js";

/**
 * Client factory for creating SDK clients with proper configuration precedence
 */
export class ClientFactory {
  /**
   * Create a Publishing API client
   *
   * Configuration precedence:
   * - apiUrl: --api-url flag > MARVIN_API_URL env var
   * - siteClientToken: --token/--site-token flag > stored token for workspace > MARVIN_SITE_CLIENT_TOKEN env var
   * - workspaceSlug: --workspace flag > active workspace > MARVIN_WORKSPACE_SLUG env var
   */
  createPublishClient(options: PublishCommandOptions): MarvinClient {
    const apiUrl = options.apiUrl || env.apiUrl || credentialsManager.getApiUrl();

    // Validate API URL if provided
    if (apiUrl) {
      validateApiUrl(apiUrl);
    }

    // Resolve workspace first (needed to look up stored token)
    const workspaceSlug = options.workspace || credentialsManager.getActiveWorkspace() || env.workspaceSlug;

    // Resolve site token — CLI flag > stored credentials > env var
    // Stored credentials beat env vars so that 'marvin login --site-token' takes effect
    // even when MARVIN_SITE_CLIENT_TOKEN is set in a project .env file.
    // Env var is the fallback for CI/automation where no credentials file exists.
    let siteClientToken = options.token;
    if (!siteClientToken && workspaceSlug) {
      siteClientToken = credentialsManager.getSiteToken(workspaceSlug);
    }
    if (!siteClientToken) {
      siteClientToken = env.siteClientToken;
    }

    if (!apiUrl) {
      throw new Error(
        "Marvin API URL is required.\n" +
        "Provide via:\n" +
        "  --api-url flag\n" +
        "  MARVIN_API_URL environment variable"
      );
    }

    if (!siteClientToken) {
      throw new Error(
        "Site client token is required for Publishing API.\n" +
        "Provide via:\n" +
        "  --token or --site-token flag\n" +
        "  MARVIN_SITE_CLIENT_TOKEN environment variable\n" +
        (workspaceSlug
          ? `  Run 'marvin workspace token' to save for workspace '${workspaceSlug}'`
          : "  Set active workspace first with 'marvin workspace use <slug>'")
      );
    }

    if (!workspaceSlug) {
      throw new Error(
        "Workspace slug is required.\n" +
        "Provide via:\n" +
        "  --workspace flag\n" +
        "  MARVIN_WORKSPACE_SLUG environment variable\n" +
        "  Set active workspace with 'marvin workspace use <slug>'"
      );
    }

    return new MarvinClient({
      apiUrl,
      siteClientToken,
      workspaceSlug,
    });
  }

  /**
   * Create a Platform API client
   *
   * Configuration precedence:
   * - apiUrl: --api-url flag > MARVIN_API_URL env var
   * - userToken: MARVIN_USER_TOKEN env var > saved credentials (no CLI flag for security)
   *
   * Note: Workspace context is managed at the server session level, not via client config
   */
  async createPlatformClient(options: PlatformCommandOptions): Promise<PlatformClient> {
    const apiUrl = options.apiUrl || env.apiUrl || credentialsManager.getApiUrl();

    // Validate API URL if provided
    if (apiUrl) {
      validateApiUrl(apiUrl);
    }

    // Note: --user-token flag is NOT supported for security reasons (shell history exposure)
    // Only support env var and saved credentials
    const userToken = env.userToken || credentialsManager.getUserToken();

    if (!apiUrl) {
      throw new Error(
        "Marvin API URL is required.\n" +
        "Provide via:\n" +
        "  --api-url flag\n" +
        "  MARVIN_API_URL environment variable"
      );
    }

    if (!userToken) {
      throw new Error(
        "User token is required for Platform API.\n" +
        "Provide via:\n" +
        "  MARVIN_USER_TOKEN environment variable\n" +
        "  Run 'marvin login' to save credentials\n" +
        "\n" +
        "Note: --user-token flag is not supported for security reasons.\n" +
        "Use environment variable or save credentials via 'marvin login'."
      );
    }

    return new PlatformClient({
      apiUrl,
      userToken,
    });
  }

  /**
   * Create a public Auth client (registration, password reset)
   *
   * Uses NoAuth — no token required. Only needs an API URL.
   *
   * Configuration precedence:
   * - apiUrl: --api-url flag > MARVIN_API_URL env var > saved credentials
   */
  createAuthClient(options: PlatformCommandOptions): AuthClient {
    const apiUrl = options.apiUrl || env.apiUrl || credentialsManager.getApiUrl();

    if (apiUrl) {
      validateApiUrl(apiUrl);
    }

    if (!apiUrl) {
      throw new Error(
        "Marvin API URL is required.\n" +
        "Provide via:\n" +
        "  --api-url flag\n" +
        "  MARVIN_API_URL environment variable"
      );
    }

    return new AuthClient(apiUrl);
  }

  /**
   * Resolve workspace slug for Platform API commands
   * Returns undefined if no workspace can be resolved
   */
  async resolveWorkspace(options: PlatformCommandOptions): Promise<string | undefined> {
    return workspaceResolver.resolve(options.workspace);
  }
}

// Singleton instance
export const clientFactory = new ClientFactory();
