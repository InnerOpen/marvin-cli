# API Mapping

Reference showing how CLI commands map to Marvin API endpoints.

## Overview

The Marvin CLI is a thin wrapper around the Marvin HTTP APIs. Understanding this mapping helps with:

- Debugging API calls
- Building custom integrations
- Understanding what happens behind the scenes
- Troubleshooting errors

## Publishing API

The Publishing API provides read-only access to published content.

### Base URL Format

```
{MARVIN_API_URL}/api/{workspace}/
```

### Site Configuration

| Command | HTTP Method | Endpoint | Response |
|---------|-------------|----------|----------|
| `marvin publish site` | `GET` | `/api/{workspace}/site` | Site config object |

**Example Request:**
```bash
GET https://api.example.com/api/my-workspace/site
Authorization: Bearer marvin_sk_token
```

**Example Response:**
```json
{
  "title": "My Site",
  "tagline": "Built with Marvin",
  "logoUrl": "https://cdn.example.com/logo.png"
}
```

### Entries

| Command | HTTP Method | Endpoint | Query Params |
|---------|-------------|----------|--------------|
| `marvin publish entries` | `GET` | `/api/{workspace}/entries` | `entryType`, `collection`, `limit` |
| `marvin publish entry <slug>` | `GET` | `/api/{workspace}/entries/{slug}` | - |

**List Entries:**
```bash
GET https://api.example.com/api/my-workspace/entries
GET https://api.example.com/api/my-workspace/entries?entryType=page
GET https://api.example.com/api/my-workspace/entries?collection=featured
GET https://api.example.com/api/my-workspace/entries?limit=10
```

**Get Single Entry:**
```bash
GET https://api.example.com/api/my-workspace/entries/homepage
```

### Collections

| Command | HTTP Method | Endpoint |
|---------|-------------|----------|
| `marvin publish collections` | `GET` | `/api/{workspace}/collections` |
| `marvin publish collection <slug>` | `GET` | `/api/{workspace}/collections/{slug}` |
| `marvin publish collection-entries <slug>` | `GET` | `/api/{workspace}/collections/{slug}/entries` |

**Examples:**
```bash
GET https://api.example.com/api/my-workspace/collections
GET https://api.example.com/api/my-workspace/collections/featured
GET https://api.example.com/api/my-workspace/collections/featured/entries
```

### Resources

| Command | HTTP Method | Endpoint |
|---------|-------------|----------|
| `marvin publish resources` | `GET` | `/api/{workspace}/resources` |
| `marvin publish resource <slug>` | `GET` | `/api/{workspace}/resources/{slug}` |
| `marvin publish resource-entries <slug>` | `GET` | `/api/{workspace}/resources/{slug}/entries` |

**Examples:**
```bash
GET https://api.example.com/api/my-workspace/resources
GET https://api.example.com/api/my-workspace/resources/kuroki-s022
GET https://api.example.com/api/my-workspace/resources/kuroki-s022/entries
```

### Assets

| Command | HTTP Method | Endpoint | Query Params |
|---------|-------------|----------|--------------|
| `marvin publish assets` | `GET` | `/api/{workspace}/assets` | `type`, `limit` |

**Examples:**
```bash
GET https://api.example.com/api/my-workspace/assets
GET https://api.example.com/api/my-workspace/assets?type=image
GET https://api.example.com/api/my-workspace/assets?limit=50
```

## Platform API

The Platform API provides full CRUD operations for workspace management.

### Base URL Format

```
{MARVIN_API_URL}/platform/
```

### Authentication

| Command | HTTP Method | Endpoint | Body |
|---------|-------------|----------|------|
| `marvin auth login` | `POST` | `/platform/auth/login` | `{email, password}` |
| `marvin auth logout` | `POST` | `/platform/auth/logout` | - |
| `marvin auth whoami` | `GET` | `/platform/auth/me` | - |

### Workspaces

| Command | HTTP Method | Endpoint |
|---------|-------------|----------|
| `marvin workspace list` | `GET` | `/platform/workspaces` |
| `marvin workspace info` | `GET` | `/platform/workspaces/{slug}` |
| `marvin workspace create` | `POST` | `/platform/workspaces` |
| `marvin workspace update` | `PATCH` | `/platform/workspaces/{slug}` |
| `marvin workspace delete` | `DELETE` | `/platform/workspaces/{slug}` |

### Entries (Platform)

| Command | HTTP Method | Endpoint |
|---------|-------------|----------|
| `marvin platform entries` | `GET` | `/platform/workspaces/{slug}/entries` |
| `marvin platform entry <slug>` | `GET` | `/platform/workspaces/{slug}/entries/{slug}` |
| `marvin platform entry create` | `POST` | `/platform/workspaces/{slug}/entries` |
| `marvin platform entry update` | `PATCH` | `/platform/workspaces/{slug}/entries/{slug}` |
| `marvin platform entry delete` | `DELETE` | `/platform/workspaces/{slug}/entries/{slug}` |
| `marvin platform entry publish` | `POST` | `/platform/workspaces/{slug}/entries/{slug}/publish` |
| `marvin platform entry unpublish` | `POST` | `/platform/workspaces/{slug}/entries/{slug}/unpublish` |

### Entry Types

| Command | HTTP Method | Endpoint |
|---------|-------------|----------|
| `marvin platform entry-types` | `GET` | `/platform/workspaces/{slug}/entry-types` |
| `marvin platform entry-type <slug>` | `GET` | `/platform/workspaces/{slug}/entry-types/{slug}` |
| `marvin platform entry-type create` | `POST` | `/platform/workspaces/{slug}/entry-types` |
| `marvin platform entry-type update` | `PATCH` | `/platform/workspaces/{slug}/entry-types/{slug}` |
| `marvin platform entry-type delete` | `DELETE` | `/platform/workspaces/{slug}/entry-types/{slug}` |

### Collections (Platform)

| Command | HTTP Method | Endpoint |
|---------|-------------|----------|
| `marvin platform collections` | `GET` | `/platform/workspaces/{slug}/collections` |
| `marvin platform collection <slug>` | `GET` | `/platform/workspaces/{slug}/collections/{slug}` |
| `marvin platform collection create` | `POST` | `/platform/workspaces/{slug}/collections` |
| `marvin platform collection update` | `PATCH` | `/platform/workspaces/{slug}/collections/{slug}` |
| `marvin platform collection delete` | `DELETE` | `/platform/workspaces/{slug}/collections/{slug}` |

### Assets (Platform)

| Command | HTTP Method | Endpoint |
|---------|-------------|----------|
| `marvin platform assets` | `GET` | `/platform/workspaces/{slug}/assets` |
| `marvin platform asset <id>` | `GET` | `/platform/workspaces/{slug}/assets/{id}` |
| `marvin platform asset upload` | `POST` | `/platform/workspaces/{slug}/assets` |
| `marvin platform asset delete` | `DELETE` | `/platform/workspaces/{slug}/assets/{id}` |

### Resources (Platform)

| Command | HTTP Method | Endpoint |
|---------|-------------|----------|
| `marvin platform resources` | `GET` | `/platform/workspaces/{slug}/resources` |
| `marvin platform resource <slug>` | `GET` | `/platform/workspaces/{slug}/resources/{slug}` |
| `marvin platform resource create` | `POST` | `/platform/workspaces/{slug}/resources` |
| `marvin platform resource update` | `PATCH` | `/platform/workspaces/{slug}/resources/{slug}` |
| `marvin platform resource delete` | `DELETE` | `/platform/workspaces/{slug}/resources/{slug}` |

### Email Templates

| Command | HTTP Method | Endpoint |
|---------|-------------|----------|
| `marvin platform email-templates` | `GET` | `/platform/workspaces/{slug}/email-templates` |
| `marvin platform email-template <id>` | `GET` | `/platform/workspaces/{slug}/email-templates/{id}` |
| `marvin platform email-template create` | `POST` | `/platform/workspaces/{slug}/email-templates` |
| `marvin platform email-template update` | `PATCH` | `/platform/workspaces/{slug}/email-templates/{id}` |
| `marvin platform email-template delete` | `DELETE` | `/platform/workspaces/{slug}/email-templates/{id}` |
| `marvin platform email-template test` | `POST` | `/platform/workspaces/{slug}/email-templates/{id}/test` |

### Webhooks

| Command | HTTP Method | Endpoint |
|---------|-------------|----------|
| `marvin platform webhooks` | `GET` | `/platform/workspaces/{slug}/webhooks` |
| `marvin platform webhook <id>` | `GET` | `/platform/workspaces/{slug}/webhooks/{id}` |
| `marvin platform webhook create` | `POST` | `/platform/workspaces/{slug}/webhooks` |
| `marvin platform webhook update` | `PATCH` | `/platform/workspaces/{slug}/webhooks/{id}` |
| `marvin platform webhook delete` | `DELETE` | `/platform/workspaces/{slug}/webhooks/{id}` |
| `marvin platform webhook test` | `POST` | `/platform/workspaces/{slug}/webhooks/{id}/test` |

### Forms

| Command | HTTP Method | Endpoint |
|---------|-------------|----------|
| `marvin platform forms` | `GET` | `/platform/workspaces/{slug}/forms` |
| `marvin platform form <id>` | `GET` | `/platform/workspaces/{slug}/forms/{id}` |
| `marvin platform form create` | `POST` | `/platform/workspaces/{slug}/forms` |
| `marvin platform form update` | `PATCH` | `/platform/workspaces/{slug}/forms/{id}` |
| `marvin platform form delete` | `DELETE` | `/platform/workspaces/{slug}/forms/{id}` |

### API Clients

| Command | HTTP Method | Endpoint |
|---------|-------------|----------|
| `marvin platform api-clients` | `GET` | `/platform/workspaces/{slug}/api-clients` |
| `marvin platform api-client <id>` | `GET` | `/platform/workspaces/{slug}/api-clients/{id}` |
| `marvin platform api-client create` | `POST` | `/platform/workspaces/{slug}/api-clients` |
| `marvin platform api-client update` | `PATCH` | `/platform/workspaces/{slug}/api-clients/{id}` |
| `marvin platform api-client delete` | `DELETE` | `/platform/workspaces/{slug}/api-clients/{id}` |
| `marvin platform api-client rotate` | `POST` | `/platform/workspaces/{slug}/api-clients/{id}/rotate` |

### Event Log

| Command | HTTP Method | Endpoint |
|---------|-------------|----------|
| `marvin platform event-log` | `GET` | `/platform/workspaces/{slug}/events` |
| `marvin platform event <id>` | `GET` | `/platform/workspaces/{slug}/events/{id}` |

### Workspace Members

| Command | HTTP Method | Endpoint |
|---------|-------------|----------|
| `marvin platform workspace-members` | `GET` | `/platform/workspaces/{slug}/members` |
| `marvin platform workspace-member <id>` | `GET` | `/platform/workspaces/{slug}/members/{id}` |
| `marvin platform workspace-member update` | `PATCH` | `/platform/workspaces/{slug}/members/{id}` |
| `marvin platform workspace-member remove` | `DELETE` | `/platform/workspaces/{slug}/members/{id}` |

### Invites

| Command | HTTP Method | Endpoint |
|---------|-------------|----------|
| `marvin platform invites` | `GET` | `/platform/workspaces/{slug}/invites` |
| `marvin platform invite create` | `POST` | `/platform/workspaces/{slug}/invites` |
| `marvin platform invite delete` | `DELETE` | `/platform/workspaces/{slug}/invites/{id}` |

## Admin API

The Admin API provides system-level operations.

### Base URL Format

```
{MARVIN_API_URL}/admin/
```

### Users

| Command | HTTP Method | Endpoint |
|---------|-------------|----------|
| `marvin admin users` | `GET` | `/admin/users` |
| `marvin admin user <id>` | `GET` | `/admin/users/{id}` |
| `marvin admin user create` | `POST` | `/admin/users` |
| `marvin admin user update` | `PATCH` | `/admin/users/{id}` |
| `marvin admin user delete` | `DELETE` | `/admin/users/{id}` |
| `marvin admin user suspend` | `POST` | `/admin/users/{id}/suspend` |
| `marvin admin user activate` | `POST` | `/admin/users/{id}/activate` |

### System

| Command | HTTP Method | Endpoint |
|---------|-------------|----------|
| `marvin admin system info` | `GET` | `/admin/system/info` |
| `marvin admin system health` | `GET` | `/admin/system/health` |
| `marvin admin system stats` | `GET` | `/admin/system/stats` |

### Maintenance

| Command | HTTP Method | Endpoint |
|---------|-------------|----------|
| `marvin admin maintenance mode-on` | `POST` | `/admin/maintenance/enable` |
| `marvin admin maintenance mode-off` | `POST` | `/admin/maintenance/disable` |
| `marvin admin maintenance cache-clear` | `POST` | `/admin/maintenance/cache/clear` |

## Authentication Headers

### Site Client Token

```http
Authorization: Bearer marvin_sk_your_token
```

**Used for:**
- Publishing API calls

**Example:**
```bash
curl -H "Authorization: Bearer marvin_sk_token" \
     https://api.example.com/api/my-workspace/entries
```

### User Session Token

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**Used for:**
- Platform API calls
- Admin API calls (if user is admin)

**Obtained from:** `marvin auth login`

**Example:**
```bash
# Login returns session token (stored automatically)
marvin auth login

# Token used in subsequent requests
curl -H "Authorization: Bearer $SESSION_TOKEN" \
     https://api.example.com/platform/workspaces
```

### API Client Credentials

```http
Authorization: Basic base64(client_id:client_secret)
```

**Used for:**
- Platform API calls (automation)

**Example:**
```bash
# Encode credentials
CREDENTIALS=$(echo -n "client_id:client_secret" | base64)

curl -H "Authorization: Basic $CREDENTIALS" \
     https://api.example.com/platform/workspaces/my-workspace/entries
```

## Response Formats

### Success Response

**Status Code:** `200 OK`

```json
{
  "data": [...],
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 20
  }
}
```

### Error Response

**Status Code:** `4xx` or `5xx`

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Entry not found",
    "details": {
      "slug": "nonexistent"
    }
  }
}
```

## Rate Limiting

Rate limit headers:

```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1625097600
```

**Publishing API:**
- 1000 requests per hour per token

**Platform API:**
- 5000 requests per hour per user/client

**Admin API:**
- 10000 requests per hour per token

## Debugging API Calls

### View Actual HTTP Requests

```bash
# Enable debug mode
export MARVIN_DEBUG=true
marvin publish entries --json

# Shows:
# > GET https://api.example.com/api/my-workspace/entries
# > Authorization: Bearer marvin_sk_***
# < 200 OK
# < Content-Type: application/json
```

### Manual API Call

```bash
# Replicate CLI call
API_URL="https://api.example.com"
WORKSPACE="my-workspace"
TOKEN="marvin_sk_token"

curl -v \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/json" \
  "$API_URL/api/$WORKSPACE/entries"
```

### Test with httpie

```bash
# Install httpie
pip install httpie

# Make request
http GET https://api.example.com/api/my-workspace/entries \
  Authorization:"Bearer marvin_sk_token"
```

## Related

- [Commands Overview](../commands/overview.md)
- [Authentication Reference](authentication.md)
- [Error Handling](error-handling.md)
- [Publishing API Commands](../commands/site.md)
