/**
 * Input validation utilities
 */

import { resolve, normalize } from "path";
import { existsSync, statSync } from "fs";

/**
 * Validate that a value is a plain JSON object (not array, null, or primitive)
 */
export function validateJsonObject(data: any, fieldName: string = "data"): void {
  if (typeof data !== "object" || data === null || Array.isArray(data)) {
    const actualType = Array.isArray(data)
      ? "array"
      : data === null
      ? "null"
      : typeof data;

    throw new Error(
      `Invalid ${fieldName}: expected a JSON object, got ${actualType}. ` +
      `Example: {"key": "value"}`
    );
  }
}

/**
 * Email validation (RFC 5322 simplified)
 * Matches the SDK's email validation pattern
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate email or throw error
 */
export function requireValidEmail(email: string, fieldName: string = "email"): void {
  if (!email || typeof email !== "string") {
    throw new Error(`${fieldName} is required`);
  }

  if (!validateEmail(email)) {
    throw new Error(
      `Invalid ${fieldName} format: "${email}". ` +
      `Expected format: user@example.com`
    );
  }
}

/**
 * Path validation options
 */
export interface PathValidationOptions {
  /** Allow absolute paths */
  allowAbsolute?: boolean;
  /** Warn when reading from sensitive directories */
  warnSensitive?: boolean;
  /** Check if file exists */
  mustExist?: boolean;
  /** Check if path is a file (not directory) */
  mustBeFile?: boolean;
}

/**
 * Sensitive directory patterns to warn about
 */
const SENSITIVE_PATTERNS = [
  /^\/etc\//,
  /^\/root\//,
  /\.ssh\//,
  /\.aws\//,
  /\.config\/gcloud\//,
  /credentials/i,
  /secret/i,
  /password/i,
  /\.env$/,
  /\.pem$/,
  /\.key$/,
  /id_rsa/,
  /id_ecdsa/,
  /id_ed25519/,
];

/**
 * Validate a file path for security concerns
 */
export function validateFilePath(
  filePath: string,
  options: PathValidationOptions = {}
): string {
  const {
    allowAbsolute = true,
    warnSensitive = true,
    mustExist = true,
    mustBeFile = true,
  } = options;

  // Normalize and resolve the path
  const normalizedPath = normalize(filePath);
  const absolutePath = resolve(filePath);

  // Check if file exists
  if (mustExist && !existsSync(absolutePath)) {
    throw new Error(`File not found: ${absolutePath}`);
  }

  // Check if it's a file (not directory)
  if (mustExist && mustBeFile) {
    const stat = statSync(absolutePath);
    if (!stat.isFile()) {
      throw new Error(`Path is not a file: ${absolutePath}`);
    }
  }

  // Warn about sensitive paths
  if (warnSensitive) {
    const isSensitive = SENSITIVE_PATTERNS.some((pattern) =>
      pattern.test(absolutePath)
    );

    if (isSensitive) {
      console.warn(`⚠️  Warning: Reading from sensitive path: ${absolutePath}`);
      console.warn(
        `   Make sure you trust this file and it doesn't contain secrets.`
      );
    }
  }

  return absolutePath;
}

/**
 * Validate URL for SSRF prevention
 */
export function validateApiUrl(url: string): void {
  if (!url || typeof url !== "string") {
    throw new Error("API URL is required");
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch (error) {
    throw new Error(`Invalid API URL: ${url}`);
  }

  // Check protocol
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error(
      `Invalid API URL protocol: ${parsed.protocol}. Must be http: or https:`
    );
  }

  // Warn about HTTP for non-localhost
  if (parsed.protocol === "http:") {
    const isLocalhost =
      parsed.hostname === "localhost" ||
      parsed.hostname === "127.0.0.1" ||
      parsed.hostname === "::1";

    if (!isLocalhost) {
      console.warn(`⚠️  Warning: Using HTTP (not HTTPS) for ${parsed.hostname}`);
      console.warn(
        `   Your credentials may be transmitted insecurely over the network.`
      );
    }
  }

  // Warn about private/internal IP ranges (basic SSRF prevention)
  const hostname = parsed.hostname;

  // Check for localhost
  if (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "::1" ||
    hostname === "0.0.0.0"
  ) {
    // Localhost is fine
    return;
  }

  // Check for private IP ranges (IPv4)
  const privateIPv4Patterns = [
    /^10\./,
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
    /^192\.168\./,
    /^169\.254\./, // Link-local
  ];

  const isPrivateIP = privateIPv4Patterns.some((pattern) =>
    pattern.test(hostname)
  );

  if (isPrivateIP) {
    console.warn(
      `⚠️  Warning: API URL points to private IP range: ${hostname}`
    );
    console.warn(
      `   This may be intentional for internal services, but could be an SSRF risk.`
    );
  }
}

/**
 * Validate that a value is a positive integer
 */
export function validatePositiveInteger(
  value: string,
  fieldName: string
): number {
  const parsed = parseInt(value, 10);

  if (isNaN(parsed)) {
    throw new Error(`${fieldName} must be a number, got: ${value}`);
  }

  if (parsed < 1) {
    throw new Error(`${fieldName} must be a positive integer, got: ${parsed}`);
  }

  return parsed;
}
