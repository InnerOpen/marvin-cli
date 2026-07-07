/**
 * Centralized environment variable reading
 * Single source of truth for all environment configuration
 */
export class Environment {
  /**
   * Marvin API URL
   * Environment variable: MARVIN_API_URL
   */
  get apiUrl(): string | undefined {
    return process.env.MARVIN_API_URL;
  }

  /**
   * Site client token for Publishing API
   * Environment variable: MARVIN_SITE_CLIENT_TOKEN
   */
  get siteClientToken(): string | undefined {
    return process.env.MARVIN_SITE_CLIENT_TOKEN;
  }

  /**
   * User token for Platform API
   * Environment variable: MARVIN_USER_TOKEN
   */
  get userToken(): string | undefined {
    return process.env.MARVIN_USER_TOKEN;
  }

  /**
   * Workspace slug
   * Environment variable: MARVIN_WORKSPACE_SLUG
   */
  get workspaceSlug(): string | undefined {
    return process.env.MARVIN_WORKSPACE_SLUG;
  }
}

// Singleton instance
export const env = new Environment();
