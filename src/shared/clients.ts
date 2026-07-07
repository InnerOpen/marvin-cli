import { MarvinClient } from "@inneropen/marvin-sdk";
import { PlatformClient } from "@inneropen/marvin-sdk/platform";
import { env } from "../config/environment.js";
import { credentialsManager } from "../config/credentials.js";
import { workspaceResolver } from "../config/workspace.js";
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
   * - siteClientToken: --token/--site-token flag > MARVIN_SITE_CLIENT_TOKEN env var
   * - workspaceSlug: --workspace flag > MARVIN_WORKSPACE_SLUG env var
   */
  createPublishClient(options: PublishCommandOptions): MarvinClient {
    const apiUrl = options.apiUrl || env.apiUrl;
    const siteClientToken = options.token || env.siteClientToken;
    const workspaceSlug = options.workspace || env.workspaceSlug;

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
        "  MARVIN_SITE_CLIENT_TOKEN environment variable"
      );
    }

    if (!workspaceSlug) {
      throw new Error(
        "Workspace slug is required.\n" +
        "Provide via:\n" +
        "  --workspace flag\n" +
        "  MARVIN_WORKSPACE_SLUG environment variable"
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
   * - userToken: --user-token flag > MARVIN_USER_TOKEN env var > saved credentials
   *
   * Note: Workspace context is managed at the server session level, not via client config
   */
  async createPlatformClient(options: PlatformCommandOptions): Promise<PlatformClient> {
    const apiUrl = options.apiUrl || env.apiUrl;
    const userToken = options.userToken || env.userToken || credentialsManager.getUserToken();

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
        "  --user-token flag\n" +
        "  MARVIN_USER_TOKEN environment variable\n" +
        "  Run 'marvin platform login' to save credentials"
      );
    }

    return new PlatformClient({
      apiUrl,
      userToken,
    });
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
