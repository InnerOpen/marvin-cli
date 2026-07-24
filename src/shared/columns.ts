import type {
  PublishedEntryType,
} from "@inneropen/marvin-sdk/types";
import type { ColumnSpec } from "../output.js";

/**
 * Minimum shape used by entryColumns for display.
 * Satisfied by MarvinEntryListItem, CollectionEntry, Entry, etc.
 */
interface EntryLike {
  title: string;
  slug: string;
  entryType: string | { slug?: string } | object;
  status?: string | null;
  publishedAt?: string | null;
  order?: number | null;
}

/**
 * Minimum shape used by collectionColumns.
 * Satisfied by MarvinCollection, PublishedCollectionSummary, etc.
 */
interface CollectionLike {
  name: string;
  slug: string;
  description?: string | null;
}

/**
 * Minimum shape used by resourceColumns.
 */
interface ResourceLike {
  name: string;
  slug: string;
  resourceType?: string | null;
  description?: string | null;
  url?: string | null;
}

/**
 * Minimum shape used by assetColumns.
 */
interface AssetLike {
  name?: string | null;
  slug: string;
  mimeType?: string | null;
  width?: number | null;
  height?: number | null;
  altText?: string | null;
}

/**
 * Column definitions for Publishing API list output
 */

export const entryColumns: ColumnSpec<EntryLike> = {
  Title: (entry) => entry.title || "",
  Slug: (entry) => entry.slug || "",
  Type: (entry) => {
    if (typeof entry.entryType === "string") return entry.entryType;
    if (typeof entry.entryType === "object" && entry.entryType && "slug" in entry.entryType) {
      return String((entry.entryType as { slug?: string }).slug ?? "");
    }
    return "";
  },
  Status: (entry) => entry.status || "",
  Published: (entry) => entry.publishedAt ? new Date(entry.publishedAt).toISOString().split('T')[0] : "",
};

export const collectionColumns: ColumnSpec<CollectionLike> = {
  Name: (collection) => collection.name || "",
  Slug: (collection) => collection.slug || "",
  Description: (collection) => (collection.description || "").substring(0, 50),
};

export const resourceColumns: ColumnSpec<ResourceLike> = {
  Name: (resource) => resource.name || "",
  Slug: (resource) => resource.slug || "",
  Type: (resource) => resource.resourceType || "",
  Description: (resource) => (resource.description || "").substring(0, 50),
  URL: (resource) => resource.url || "",
};

export const rendererColumns: ColumnSpec<PublishedEntryType> = {
  Name: (et) => et.name || "",
  Slug: (et) => et.slug || "",
  Renderer: (et) => et.rendering?.renderer || "",
  Package: (et) => et.rendering?.package || "",
  Publishable: (et) => et.capabilities?.publishable !== false ? "yes" : "no",
  Routable: (et) => et.capabilities?.routable !== false ? "yes" : "no",
};

export const assetColumns: ColumnSpec<AssetLike> = {
  Name: (asset) => asset.name || asset.slug || "",
  Slug: (asset) => asset.slug || "",
  Type: (asset) => asset.mimeType || "",
  Dimensions: (asset) =>
    asset.width && asset.height ? `${asset.width}x${asset.height}` : "",
  Alt: (asset) => (asset.altText || "").substring(0, 40),
};

/**
 * Column definitions for Platform API list output
 * These include ID fields since Platform API returns UUID ids
 */

export const platformEntryColumns: ColumnSpec<EntryLike & { id?: string }> = {
  ID: (entry) => entry.id || "",
  ...entryColumns,
};

export const platformCollectionColumns: ColumnSpec<CollectionLike & { id?: string }> = {
  ID: (collection) => collection.id || "",
  ...collectionColumns,
};

export const platformResourceColumns: ColumnSpec<ResourceLike & { id?: string }> = {
  ID: (resource) => resource.id || "",
  ...resourceColumns,
};

export const platformAssetColumns: ColumnSpec<AssetLike & { id?: string }> = {
  ID: (asset) => asset.id || "",
  ...assetColumns,
};
