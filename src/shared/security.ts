/**
 * Security utilities for handling sensitive data
 */

/**
 * Mask a token for display, showing only first/last chars
 * @param token - Token to mask
 * @param showChars - Number of characters to show at start/end (default: 4)
 */
export function maskToken(token: string | null | undefined, showChars: number = 4): string {
  if (!token) {
    return 'N/A';
  }

  if (token.length <= showChars * 2) {
    return '*'.repeat(token.length);
  }

  const start = token.substring(0, showChars);
  const end = token.substring(token.length - showChars);
  const middle = '*'.repeat(Math.min(token.length - (showChars * 2), 20));

  return `${start}${middle}${end}`;
}

/**
 * Determine if token should be shown in full or masked
 * Only show full token in interactive TTY sessions, mask in CI/logs
 */
export function shouldShowFullToken(): boolean {
  return process.stdout.isTTY === true;
}

/**
 * Format token for output - shows full in TTY, masked otherwise
 */
export function formatTokenForOutput(token: string | null | undefined, showChars: number = 4): string {
  if (!token) {
    return 'N/A';
  }

  if (shouldShowFullToken()) {
    return token;
  }

  return maskToken(token, showChars);
}

/**
 * Display security warning about token exposure
 */
export function displayTokenWarning(): void {
  if (!shouldShowFullToken()) {
    console.log('⚠️  Token is masked because output is not a TTY (CI/logging environment)');
    console.log('   Run this command interactively to see the full token');
  }
}
