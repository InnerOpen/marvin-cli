import type {
  MarvinAsset,
  MarvinCollection,
  MarvinEntry,
  MarvinResource,
  PublishedEntryType,
} from "@inneropen/marvin-sdk/types";
import type { ColumnSpec } from "../output.js";

/**
 * Column definitions for Publishing API list output
 */

export const entryColumns: ColumnSpec<MarvinEntry> = {
  Title: (entry) => entry.title || "",
  Slug: (entry) => entry.slug || "",
  Type: (entry) => {
    // entryType is a string (slug) from the publishing API
    if (typeof entry.entryType === "string") return entry.entryType;
    // Fallback for object format from admin API
    if (typeof entry.entryType === "object" && entry.entryType && "slug" in entry.entryType) {
      return String((entry.entryType as { slug?: string }).slug ?? "");
    }
    return "";
  },
  Status: (entry) => entry.status || "",
  Published: (entry) => entry.publishedAt ? new Date(entry.publishedAt).toISOString().split('T')[0] : "",
};

export const collectionColumns: ColumnSpec<MarvinCollection> = {
  Name: (collection) => collection.name || "",
  Slug: (collection) => collection.slug || "",
  Description: (collection) => (collection.description || "").substring(0, 50),
};

export const resourceColumns: ColumnSpec<MarvinResource> = {
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

export const assetColumns: ColumnSpec<MarvinAsset> = {
  Name: (asset) => asset.name || asset.slug || "",
  Slug: (asset) => asset.slug || "",
  Type: (asset) => asset.mimeType || "",
  Dimensions: (asset) =>
    asset.width && asset.height ? `${asset.width}x${asset.height}` : "",
  Alt: (asset) => (asset.altText || "").substring(0, 40),
};

/**
 * Column definitions for Platform API list output
 * These include ID fields since Platform API returns them
 */

export const platformEntryColumns: ColumnSpec<MarvinEntry> = {
  ID: (entry) => entry.id || "",
  ...entryColumns,
};

export const platformCollectionColumns: ColumnSpec<MarvinCollection> = {
  ID: (collection) => collection.id || "",
  ...collectionColumns,
};

export const platformResourceColumns: ColumnSpec<MarvinResource> = {
  ID: (resource) => resource.id || "",
  ...resourceColumns,
};

export const platformAssetColumns: ColumnSpec<MarvinAsset> = {
  ID: (asset) => asset.id || "",
  ...assetColumns,
};
