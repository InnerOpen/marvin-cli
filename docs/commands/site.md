# Site Configuration

Fetch the workspace's public site configuration (title, tagline, logo, locale, SEO and so on) from
the Publishing API.

## Command

```bash
marvin publish site
```

The command takes no options of its own. It uses the `publish` group options `--site-token <token>`
(alias `--token`) plus the [global options](overview.md#global-options).

## Output

`marvin publish site` prints one object with two parts: `workspace` (`slug`, `name`) and `site`.
In the default table mode the object is pretty-printed rather than drawn as a table; use `--json`,
`--yaml` or `--csv` for machine-readable output.

```bash
marvin publish site --json
```

```json
{
  "workspace": { "slug": "acme", "name": "Acme" },
  "site": {
    "title": "My Awesome Site",
    "tagline": "Built with Marvin CMS",
    "description": "A modern headless CMS solution",
    "canonicalUrl": "https://example.com",
    "logo": "https://cdn.example.com/logo.png",
    "favicon": "https://cdn.example.com/favicon.ico",
    "locale": "en-US",
    "timezone": "America/New_York",
    "contactEmail": "hello@example.com",
    "social": {},
    "seo": { "robots": "index,follow", "ogType": "website" },
    "metadataJson": {}
  }
}
```

| `site` field | Description |
|--------------|-------------|
| `title`, `tagline`, `description` | Public identity of the site |
| `canonicalUrl` | Canonical base URL |
| `logo`, `favicon` | Image URLs |
| `locale` | Locale (default `en-US`) |
| `timezone` | IANA timezone (default `America/New_York`) |
| `contactEmail` | Public contact address |
| `social` | Social links map |
| `seo` | Site-wide SEO defaults (title template, keywords, robots, Open Graph type, and similar) |
| `metadataJson` | Free-form metadata |

## Examples

```bash
# Site title
marvin publish site --json | jq -r '.site.title'

# Save the configuration
marvin publish site --json > site-config.json

# Confirm which workspace the token belongs to
marvin publish site --json | jq -r '.workspace.slug'
```

## Authentication

Needs a site client token. It is resolved in this order: `--site-token` / `--token` flag, the token
saved for the active workspace (`marvin workspace token`, or `marvin login --site-token`), then the
`MARVIN_SITE_CLIENT_TOKEN` environment variable. The API URL comes from `--api-url`, the saved
credentials or `MARVIN_API_URL`.

```bash
export MARVIN_SITE_CLIENT_TOKEN=marvin_sk_your_token
marvin publish site --site-token marvin_sk_your_token
```

A 401 means the token is invalid or missing; a 404 usually means the workspace slug or API URL is
wrong (check `marvin workspace current`).

## Related Commands

- [`marvin publish entries`](entries.md) - List published entries
- [`marvin publish collections`](collections.md) - List collections
- [`marvin workspace token`](workspaces.md#workspace-token) - Save a site client token

## API Reference

This command calls `GET /api/publish/{workspace}/site`. See [API Mapping](../reference/api-mapping.md).
