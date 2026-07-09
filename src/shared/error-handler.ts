/**
 * Error handling utilities for CLI commands
 */

import { MarvinApiError, MarvinAuthError, MarvinConfigError, MarvinValidationError } from "@inneropen/marvin-sdk/core/errors";
import chalk from "chalk";

/**
 * Format and display error messages with helpful context
 */
export function handleCommandError(error: unknown): void {
  if (error instanceof MarvinAuthError) {
    console.error(chalk.red("✗ Authentication Error"));
    console.error(chalk.dim(error.message));
    console.error();
    console.error(chalk.yellow("Suggestions:"));
    console.error(chalk.dim("  • Check that you're logged in: marvin platform login"));
    console.error(chalk.dim("  • Verify your token hasn't expired"));
    console.error(chalk.dim("  • Ensure you have permission to access this workspace"));
    process.exitCode = 1;
    return;
  }

  if (error instanceof MarvinApiError) {
    console.error(chalk.red(`✗ API Error (${error.statusCode})`));
    console.error(chalk.dim(`Endpoint: ${error.endpoint}`));

    // Try to parse error response for better messages
    if (error.responseBody) {
      try {
        const body = JSON.parse(error.responseBody);
        if (body.detail) {
          console.error(chalk.dim(body.detail));
        } else {
          console.error(chalk.dim(error.responseBody));
        }
      } catch {
        console.error(chalk.dim(error.responseBody));
      }
    } else {
      console.error(chalk.dim(error.message));
    }

    console.error();

    // Provide helpful suggestions based on status code
    if (error.statusCode === 401) {
      console.error(chalk.yellow("Suggestions:"));
      console.error(chalk.dim("  • Run 'marvin platform login' to authenticate"));
      console.error(chalk.dim("  • Check that your credentials haven't expired"));
    } else if (error.statusCode === 403) {
      console.error(chalk.yellow("Suggestions:"));
      console.error(chalk.dim("  • Verify you have permission for this operation"));
      console.error(chalk.dim("  • Check you're in the correct workspace"));
    } else if (error.statusCode === 404) {
      console.error(chalk.yellow("Suggestions:"));
      console.error(chalk.dim("  • Double-check the ID or slug you provided"));
      console.error(chalk.dim("  • Ensure the resource exists in this workspace"));
    } else if (error.statusCode === 422) {
      console.error(chalk.yellow("Suggestions:"));
      console.error(chalk.dim("  • Check your input data format"));
      console.error(chalk.dim("  • Verify all required fields are provided"));
    } else if (error.statusCode === 409) {
      console.error(chalk.yellow("Suggestions:"));
      console.error(chalk.dim("  • The resource may already exist (duplicate slug?)"));
      console.error(chalk.dim("  • Try using a different name or slug"));
    } else if (error.statusCode >= 500) {
      console.error(chalk.yellow("Suggestions:"));
      console.error(chalk.dim("  • This is a server error - try again in a moment"));
      console.error(chalk.dim("  • If the problem persists, contact support"));
    }

    process.exitCode = 1;
    return;
  }

  if (error instanceof MarvinConfigError) {
    console.error(chalk.red("✗ Configuration Error"));
    console.error(chalk.dim(error.message));
    console.error();
    console.error(chalk.yellow("Suggestions:"));
    console.error(chalk.dim("  • Run 'marvin config list' to see current configuration"));
    console.error(chalk.dim("  • Check your environment variables"));
    process.exitCode = 1;
    return;
  }

  if (error instanceof MarvinValidationError) {
    console.error(chalk.red("✗ Validation Error"));
    if (error.field) {
      console.error(chalk.dim(`Field: ${error.field}`));
    }
    console.error(chalk.dim(error.message));
    process.exitCode = 1;
    return;
  }

  // Generic error handling
  if (error instanceof Error) {
    // Check if it's a missing configuration error
    if (error.message.includes("is required")) {
      console.error(chalk.red("✗ Configuration Error"));
      console.error(chalk.dim(error.message));
    } else {
      console.error(chalk.red("✗ Error"));
      console.error(chalk.dim(error.message));
    }

    // Show stack trace in debug mode
    if (process.env.DEBUG || process.env.MARVIN_DEBUG) {
      console.error();
      console.error(chalk.dim("Stack trace:"));
      console.error(chalk.dim(error.stack));
    }
  } else {
    console.error(chalk.red("✗ Unknown Error"));
    console.error(chalk.dim(String(error)));
  }

  process.exitCode = 1;
}

/**
 * Validate required options and provide helpful error messages
 */
export function validateOptions(options: Record<string, any>, required: string[]): void {
  const missing = required.filter(key => !options[key]);

  if (missing.length > 0) {
    console.error(chalk.red("✗ Missing required options:"));
    missing.forEach(key => {
      console.error(chalk.dim(`  --${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`));
    });
    process.exit(1);
  }
}
