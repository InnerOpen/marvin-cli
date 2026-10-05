/**
 * `--page/--per-page/--all` for list endpoints that answer with a pagination envelope
 * (`{ items, page, per_page, total, total_pages }`).
 *
 * The SDK's list helpers for these return page 1's items only, so the commands fetch the envelope
 * through the client's own `get` with the paging query.
 */

import type { Command } from "commander";
import { validatePositiveInteger } from "./validation.js";

export function addPageOptions(cmd: Command): Command {
  return cmd
    .option("--page <number>", "Page number", "1")
    .option("--per-page <number>", "Items per page", "50")
    .option("--all", "Fetch every page (ignores --page)");
}

interface PageEnvelope<T> {
  items?: T[];
  total_pages?: number;
  totalPages?: number;
}

interface Getter {
  get<R>(endpoint: string, params?: Record<string, string | number | boolean | undefined>): Promise<R>;
}

/** Items of a page; a bare array (an unpaginated endpoint) passes through as-is. */
function itemsOf<T>(body: PageEnvelope<T> | T[]): T[] {
  return Array.isArray(body) ? body : body.items ?? [];
}

/** Safety stop for --all, in case a server never reports total_pages. */
const MAX_PAGES = 1000;

/** Fetch one page (or every page with --all) of `path` and return the items. */
export async function fetchPages<T>(
  client: Getter,
  path: string,
  cmdOpts: { page?: string; perPage?: string; all?: boolean },
): Promise<T[]> {
  const perPage = validatePositiveInteger(cmdOpts.perPage ?? "50", "--per-page");

  if (!cmdOpts.all) {
    const page = validatePositiveInteger(cmdOpts.page ?? "1", "--page");
    return itemsOf(await client.get<PageEnvelope<T> | T[]>(path, { page, perPage }));
  }

  const items: T[] = [];
  for (let page = 1; page <= MAX_PAGES; page++) {
    const body = await client.get<PageEnvelope<T> | T[]>(path, { page, perPage });
    const batch = itemsOf(body);
    items.push(...batch);
    if (Array.isArray(body)) break;
    const totalPages = body.total_pages ?? body.totalPages;
    if (batch.length === 0 || (totalPages !== undefined ? page >= totalPages : batch.length < perPage)) break;
  }
  return items;
}
