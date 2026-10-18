# API Mapping

Reference showing which API request each CLI command sends. The tables were produced by running every
command against the SDK with a recording `fetch`, so they show the real method and path (a few
local-only commands are marked). Placeholders such as `{id}` are the command's own arguments.

## Overview

The Marvin CLI is a thin wrapper around the Marvin HTTP APIs through `@inneropen/marvin-sdk`. Understanding this mapping helps with:

- Debugging API calls
- Building custom integrations
- Understanding what happens behind the scenes
- Troubleshooting errors

Three kinds of credential are used:

| Commands | Credential | Header |
|----------|------------|--------|
| `publish …` | Site client token (`marvin_sk_…`) | `Authorization: Bearer <site token>` |
| `platform …`, `admin …`, `user …`, `events …`, `workspace …` | User token (`marvin login`, `MARVIN_USER_TOKEN`) | `Authorization: Bearer <user token>` |
| `login`, `register`, `forgot-password`, `reset-password`, `system health` | none | none |

`{workspace}` is the workspace slug for the Publishing API. Platform commands act on the workspace
the user token's session has selected (`marvin workspace use`); where a path shows `{workspace_id}`
for `platform email-templates` and `workspace preferences update`, the SDK first reads the current
workspace (`GET /api/self/workspaces/current`) and uses its id.

## Publishing API

| Command | HTTP Method | Endpoint |
|---------|-------------|----------|
| `marvin publish site` | `GET` | `/api/publish/{workspace}/site` |
| `marvin publish entries` | `GET` | `/api/publish/{workspace}/entries` |
| `marvin publish entry <slug>` | `GET` | `/api/publish/{workspace}/entries/{slug}` |
| `marvin publish collections` | `GET` | `/api/publish/{workspace}/collections` |
| `marvin publish collection <slug>` | `GET` | `/api/publish/{workspace}/collections/{slug}` |
| `marvin publish collection-entries <slug>` | `GET` | `/api/publish/{workspace}/collections/{slug}` (the entries come back inside the collection) |
| `marvin publish renderers` | `GET` | `/api/publish/{workspace}/entry-types` |

Query parameters, set by flags: `publish entries` sends `entry_type`, `collection`, `tag`, `slug`,
`updated_since`, `limit`, `offset` and `expand`; `publish collections` sends `limit` and `offset`
(the server returns 20 by default and at most 100 per request). The Publishing API has no asset or
resource routes: entries carry their assets and resources inline.

## Login and workspaces

### Login and registration

| Command | HTTP Method | Endpoint |
|---------|-------------|----------|
| `marvin login` | `GET` | `/api/self` (checks the token, then saves it locally) |
| `marvin logout` | - | (local: clears the saved user token) |
| `marvin register` | `POST` | `/api/users/register` |
| `marvin forgot-password <email>` | `POST` | `/api/users/forgot-password` |
| `marvin reset-password` | `POST` | `/api/users/reset-password` |

### Workspace

| Command | HTTP Method | Endpoint |
|---------|-------------|----------|
| `marvin workspace current` | - | (local: the active workspace from saved credentials) |
| `marvin workspace use <workspace>` | `PUT` | `/api/self/workspaces/current` |
| `marvin workspace list` | `GET` | `/api/self/workspaces` |
| `marvin workspace token` | - | (local: saves a site token for the active workspace) |
| `marvin workspace export` | `GET` | `/api/platform/workspace/export/pretty` |
| `marvin workspace token:remove` | - | (local: removes the saved site token) |
| `marvin workspace import` | `POST` | `/api/platform/workspace/import` |
| `marvin workspace preferences update` | `PATCH` | `/api/groups/{workspace_id}/preferences` |
| `marvin workspace stats` | `GET` | `/api/platform/stats` |
| `marvin workspace backups list` | `GET` | `/api/platform/workspace/backups` |
| `marvin workspace backups download <filename>` | `GET` | `/api/platform/workspace/backups/{filename}` |
| `marvin workspace backups create` | `POST` | `/api/platform/workspace/backups` |

## User

| Command | HTTP Method | Endpoint |
|---------|-------------|----------|
| `marvin user profile show` | `GET` | `/api/self` |
| `marvin user profile update` | `PUT` | `/api/self` |
| `marvin user tokens list` | `GET` | `/api/self/api-tokens` |
| `marvin user tokens create` | `POST` | `/api/self/api-tokens` |
| `marvin user tokens get <token-id>` | `GET` | `/api/self/api-tokens/{token_id}` |
| `marvin user tokens update <token-id>` | `PATCH` | `/api/self/api-tokens/{token_id}` |
| `marvin user tokens revoke <token-id>` | `POST` | `/api/self/api-tokens/{token_id}/revoke` |
| `marvin user tokens rotate <token-id>` | `POST` | `/api/self/api-tokens/{token_id}/rotate` |
| `marvin user tokens delete <token-id>` | `DELETE` | `/api/self/api-tokens/{token_id}` |
| `marvin user change-password` | `PUT` | `/api/self/password` |

## Platform API

### Workspace members

| Command | HTTP Method | Endpoint |
|---------|-------------|----------|
| `marvin platform workspace-members list <workspace-id>` | `GET` | `/api/platform/workspaces/{workspace_id}/members` |
| `marvin platform workspace-members get <workspace-id> <user-id>` | `GET` | `/api/platform/workspaces/{workspace_id}/members/{user_id}` |
| `marvin platform workspace-members add <workspace-id>` | `POST` | `/api/platform/workspaces/{workspace_id}/members` |
| `marvin platform workspace-members update-role <workspace-id> <user-id>` | `PUT` | `/api/platform/workspaces/{workspace_id}/members/{user_id}` |
| `marvin platform workspace-members remove <workspace-id> <user-id>` | `DELETE` | `/api/platform/workspaces/{workspace_id}/members/{user_id}` |

### Entries

| Command | HTTP Method | Endpoint |
|---------|-------------|----------|
| `marvin platform entries list` | `GET` | `/api/platform/entries` |
| `marvin platform entries counts` | `GET` | `/api/platform/entries/counts` |
| `marvin platform entries get <id>` | `GET` | `/api/platform/entries/{id}` |
| `marvin platform entries create` | `POST` | `/api/platform/entries` |
| `marvin platform entries update <id>` | `PATCH` | `/api/platform/entries/{id}` |
| `marvin platform entries delete <id>` | `DELETE` | `/api/platform/entries/{id}` |
| `marvin platform entries suggested-assets list <entry-id>` | `GET` | `/api/platform/entries/{entry_id}` |
| `marvin platform entries suggested-assets approve <entry-id> <asset-id>` | `POST` | `/api/platform/entries/{entry_id}/suggested-assets/{asset_id}/approve` |
| `marvin platform entries suggested-assets reject <entry-id> <asset-id>` | `POST` | `/api/platform/entries/{entry_id}/suggested-assets/{asset_id}/reject` |
| `marvin platform entries apply-suggestion <id>` | `POST` | `/api/platform/entries/{id}/apply-suggestion` |
| `marvin platform entries reject-suggestion <id>` | `POST` | `/api/platform/entries/{id}/reject-suggestion` |
| `marvin platform entries collections <id>` | `GET` | `/api/platform/entries/{id}/collections` |
| `marvin platform entries add-to-collection <entry-id> <collection-id>` | `POST` | `/api/platform/entries/{entry_id}/collections/{collection_id}` |
| `marvin platform entries remove-from-collection <entry-id> <collection-id>` | `DELETE` | `/api/platform/entries/{entry_id}/collections/{collection_id}` |

### Collections

| Command | HTTP Method | Endpoint |
|---------|-------------|----------|
| `marvin platform collections list` | `GET` | `/api/platform/collections` |
| `marvin platform collections get <id>` | `GET` | `/api/platform/collections/{id}` |
| `marvin platform collections create` | `POST` | `/api/platform/collections` |
| `marvin platform collections update <id>` | `PATCH` | `/api/platform/collections/{id}` |
| `marvin platform collections delete <id>` | `DELETE` | `/api/platform/collections/{id}` |
| `marvin platform collections members <id>` | `GET` | `/api/platform/collections/{id}/members` |
| `marvin platform collections preview` | `POST` | `/api/platform/collections/preview` |
| `marvin platform collections order <ids>` | `PATCH` | `/api/platform/collections/order` |
| `marvin platform collections entries <id>` | `GET` | `/api/platform/collections/{id}/entries` |
| `marvin platform collections reorder <id>` | `PATCH` | `/api/platform/collections/order` |
| `marvin platform collections update-entry <id> <entry-id>` | `PATCH` | `/api/platform/collections/{id}/entries/{entry_id}` |

### Resources

| Command | HTTP Method | Endpoint |
|---------|-------------|----------|
| `marvin platform resources list` | `GET` | `/api/platform/resources` |
| `marvin platform resources get <id>` | `GET` | `/api/platform/resources/{id}` |
| `marvin platform resources create` | `POST` | `/api/platform/resources` |
| `marvin platform resources update <id>` | `PATCH` | `/api/platform/resources/{id}` |
| `marvin platform resources delete <id>` | `DELETE` | `/api/platform/resources/{id}` |
| `marvin platform resources apply-suggestion <id>` | `POST` | `/api/platform/resources/{id}/apply-suggestion` |
| `marvin platform resources reject-suggestion <id>` | `POST` | `/api/platform/resources/{id}/reject-suggestion` |

### Assets

| Command | HTTP Method | Endpoint |
|---------|-------------|----------|
| `marvin platform assets list` | `GET` | `/api/platform/assets` |
| `marvin platform assets get <id>` | `GET` | `/api/platform/assets/{id}` |
| `marvin platform assets upload <path>` | `POST` | `/api/platform/assets/upload` |
| `marvin platform assets download <id>` | `GET` | `/api/platform/assets/{id}/file` |
| `marvin platform assets update <id>` | `PATCH` | `/api/platform/assets/{id}` |
| `marvin platform assets apply-suggestion <id>` | `POST` | `/api/platform/assets/{id}/apply-suggestion` |
| `marvin platform assets reject-suggestion <id>` | `POST` | `/api/platform/assets/{id}/reject-suggestion` |
| `marvin platform assets delete <id>` | `DELETE` | `/api/platform/assets/{id}` |

### Entry types

| Command | HTTP Method | Endpoint |
|---------|-------------|----------|
| `marvin platform entry-types list` | `GET` | `/api/platform/entry-types` |
| `marvin platform entry-types get <id>` | `GET` | `/api/platform/entry-types/{id}` |
| `marvin platform entry-types create` | `POST` | `/api/platform/entry-types` |
| `marvin platform entry-types update <id>` | `PATCH` | `/api/platform/entry-types/{id}` |
| `marvin platform entry-types delete <id>` | `DELETE` | `/api/platform/entry-types/{id}` |

### API clients

| Command | HTTP Method | Endpoint |
|---------|-------------|----------|
| `marvin platform api-clients list` | `GET` | `/api/platform/api-clients` |
| `marvin platform api-clients get <id>` | `GET` | `/api/platform/api-clients/{id}` |
| `marvin platform api-clients create` | `POST` | `/api/platform/api-clients` |
| `marvin platform api-clients update <id>` | `PATCH` | `/api/platform/api-clients/{id}` |
| `marvin platform api-clients delete <id>` | `DELETE` | `/api/platform/api-clients/{id}` |
| `marvin platform api-clients rotate-token <id>` | `POST` | `/api/platform/api-clients/{id}/rotate-token` |
| `marvin platform api-clients preview <id>` | `GET` | `/api/platform/api-clients/{id}/preview` |

### Webhooks

| Command | HTTP Method | Endpoint |
|---------|-------------|----------|
| `marvin platform webhooks list` | `GET` | `/api/groups/webhooks?page=1&perPage=50` |
| `marvin platform webhooks get <id>` | `GET` | `/api/groups/webhooks/{id}` |
| `marvin platform webhooks create` | `POST` | `/api/groups/webhooks` |
| `marvin platform webhooks update <id>` | `PUT` | `/api/groups/webhooks/{id}` |
| `marvin platform webhooks delete <id>` | `DELETE` | `/api/groups/webhooks/{id}` |
| `marvin platform webhooks test <id>` | `GET` | `/api/groups/webhooks/{id}/test` |
| `marvin platform webhooks types` | `GET` | `/api/groups/webhooks/types` |
| `marvin platform webhooks rerun` | `POST` | `/api/groups/webhooks/rerun` |
| `marvin platform webhooks log` | `GET` | `/api/groups/webhooks/log?limit=50` |
| `marvin platform webhooks logs <id>` | `GET` | `/api/groups/webhooks/{id}/logs?limit=50` |

### Invites

| Command | HTTP Method | Endpoint |
|---------|-------------|----------|
| `marvin platform invites list` | `GET` | `/api/groups/invitations?page=1&perPage=50` |
| `marvin platform invites invite` | `POST` | `/api/groups/invitations` |
| `marvin platform invites link` | - | (local: builds the link from a token) |
| `marvin platform invites revoke` | `DELETE` | `/api/groups/invitations/{id}` |

### Event log

| Command | HTTP Method | Endpoint |
|---------|-------------|----------|
| `marvin platform event-log list` | `GET` | `/api/platform/events?limit=50` |
| `marvin platform event-log get <event-id>` | `GET` | `/api/platform/events/{event_id}` |
| `marvin platform event-log entity <entity-id>` | `GET` | `/api/platform/events/entity/{entity_id}?limit=100` |
| `marvin platform event-log user <user-id>` | `GET` | `/api/platform/events/user/{user_id}?limit=100` |
| `marvin platform event-log types` | `GET` | `/api/event/types` |

### Email templates

| Command | HTTP Method | Endpoint |
|---------|-------------|----------|
| `marvin platform email-templates list` | `GET` | `/api/platform/workspaces/{workspace_id}/email-templates` |
| `marvin platform email-templates get <template-id>` | `GET` | `/api/platform/workspaces/{workspace_id}/email-templates/{template_id}` |
| `marvin platform email-templates create` | `POST` | `/api/platform/workspaces/{workspace_id}/email-templates` |
| `marvin platform email-templates update <template-id>` | `PATCH` | `/api/platform/workspaces/{workspace_id}/email-templates/{template_id}` |
| `marvin platform email-templates delete <template-id>` | `GET` | `/api/self/workspaces/current` |
| `marvin platform email-templates event-connections <group-id>` | `GET` | `/api/platform/workspaces/{group_id}/email-templates/event-connections` |
| `marvin platform email-templates test-send <template-id> <email>` | `POST` | `/api/platform/workspaces/{workspace_id}/email-templates/{template_id}/test` |

### Email

| Command | HTTP Method | Endpoint |
|---------|-------------|----------|
| `marvin platform email template-vars` | `GET` | `/api/platform/email/template-vars?template_type={type}` |
| `marvin platform email get-template <id>` | `GET` | `/api/platform/email/templates/{id}` |
| `marvin platform email update-template <id>` | `PATCH` | `/api/platform/email/templates/{id}` |
| `marvin platform email test-template <id> <email>` | `POST` | `/api/platform/email/templates/{id}/test` |
| `marvin platform email test-smtp <email>` | `POST` | `/api/platform/email/test` |

### Scheduled tasks

| Command | HTTP Method | Endpoint |
|---------|-------------|----------|
| `marvin platform scheduled-tasks list` | `GET` | `/api/platform/scheduled-tasks` |
| `marvin platform scheduled-tasks get <id-or-slug>` | `GET` | `/api/platform/scheduled-tasks/{id_or_slug}` |
| `marvin platform scheduled-tasks create` | `POST` | `/api/platform/scheduled-tasks` |
| `marvin platform scheduled-tasks update <id-or-slug>` | `PATCH` | `/api/platform/scheduled-tasks/{id_or_slug}` |
| `marvin platform scheduled-tasks delete <id-or-slug>` | `DELETE` | `/api/platform/scheduled-tasks/{id_or_slug}` |
| `marvin platform scheduled-tasks run <id-or-slug>` | `POST` | `/api/platform/scheduled-tasks/{id_or_slug}/execute` |
| `marvin platform scheduled-tasks history <id-or-slug>` | `GET` | `/api/platform/scheduled-tasks/{id_or_slug}/history?limit=50` |
| `marvin platform scheduled-tasks types` | `GET` | `/api/platform/scheduled-tasks/task-types` |
| `marvin platform scheduled-tasks log` | `GET` | `/api/platform/scheduled-tasks/log?limit=50` |
| `marvin platform scheduled-tasks stats` | `GET` | `/api/platform/scheduled-tasks` |

### Forms

| Command | HTTP Method | Endpoint |
|---------|-------------|----------|
| `marvin platform forms list` | `GET` | `/api/platform/forms` |
| `marvin platform forms get <id>` | `GET` | `/api/platform/forms/{id}` |
| `marvin platform forms create` | `POST` | `/api/platform/forms` |
| `marvin platform forms update <id>` | `PATCH` | `/api/platform/forms/{id}` |
| `marvin platform forms delete <id>` | `DELETE` | `/api/platform/forms/{id}` |
| `marvin platform forms submissions <formId>` | `GET` | `/api/platform/forms/{formId}/submissions?limit=100&offset=0` |
| `marvin platform forms get-published <slug>` | `GET` | `/api/self/workspaces/current` |
| `marvin platform forms submit <slug>` | `GET` | `/api/self/workspaces/current` |

### Secrets

| Command | HTTP Method | Endpoint |
|---------|-------------|----------|
| `marvin platform secrets list` | `GET` | `/api/groups/secrets` |
| `marvin platform secrets slugs` | `GET` | `/api/groups/secrets/slugs` |
| `marvin platform secrets reveal <id>` | `GET` | `/api/groups/secrets/{id}/reveal` |
| `marvin platform secrets create` | `POST` | `/api/groups/secrets` |
| `marvin platform secrets update <id>` | `PATCH` | `/api/groups/secrets/{id}` |
| `marvin platform secrets delete <id>` | `DELETE` | `/api/groups/secrets/{id}` |

### Variables

| Command | HTTP Method | Endpoint |
|---------|-------------|----------|
| `marvin platform variables list` | `GET` | `/api/groups/variables` |
| `marvin platform variables create` | `POST` | `/api/groups/variables` |
| `marvin platform variables update <id>` | `PATCH` | `/api/groups/variables/{id}` |
| `marvin platform variables delete <id>` | `DELETE` | `/api/groups/variables/{id}` |

### Email event subscriptions

| Command | HTTP Method | Endpoint |
|---------|-------------|----------|
| `marvin platform email-subscriptions list` | `GET` | `/api/groups/email-event-subscriptions` |
| `marvin platform email-subscriptions get <id>` | `GET` | `/api/groups/email-event-subscriptions/{id}` |
| `marvin platform email-subscriptions create` | `POST` | `/api/groups/email-event-subscriptions` |
| `marvin platform email-subscriptions delete <id>` | `DELETE` | `/api/groups/email-event-subscriptions/{id}` |

### Workflows

| Command | HTTP Method | Endpoint |
|---------|-------------|----------|
| `marvin platform workflows list` | `GET` | `/api/automations` |
| `marvin platform workflows get <workflow>` | `GET` | `/api/automations` |
| `marvin platform workflows options` | `GET` | `/api/automations/options` |
| `marvin platform workflows create` | `POST` | `/api/automations` |
| `marvin platform workflows update <workflow>` | `GET` | `/api/automations` |
| `marvin platform workflows delete <workflow>` | `GET` | `/api/automations` |
| `marvin platform workflows enable <workflow>` | `GET` | `/api/automations` |
| `marvin platform workflows disable <workflow>` | `GET` | `/api/automations` |
| `marvin platform workflows validate <workflow>` | `GET` | `/api/automations` |
| `marvin platform workflows preview <workflow>` | `GET` | `/api/automations` |
| `marvin platform workflows run <workflow>` | `GET` | `/api/automations` |
| `marvin platform workflows samples <workflow>` | `GET` | `/api/automations` |
| `marvin platform workflows executions <workflow>` | `GET` | `/api/automations` |
| `marvin platform workflows execution <workflow> <execution-id>` | `GET` | `/api/automations` |

### Integrations

| Command | HTTP Method | Endpoint |
|---------|-------------|----------|
| `marvin platform integrations list` | `GET` | `/api/groups/integrations` |
| `marvin platform integrations get <integration>` | `GET` | `/api/groups/integrations` |
| `marvin platform integrations providers` | `GET` | `/api/groups/integrations/providers` |
| `marvin platform integrations plugins` | `GET` | `/api/groups/integrations/plugins` |
| `marvin platform integrations create` | `POST` | `/api/groups/integrations` |
| `marvin platform integrations update <integration>` | `GET` | `/api/groups/integrations` |
| `marvin platform integrations delete <integration>` | `GET` | `/api/groups/integrations` |
| `marvin platform integrations check <integration>` | `GET` | `/api/groups/integrations` |
| `marvin platform integrations resolve <integration>` | `GET` | `/api/groups/integrations` |
| `marvin platform integrations run <integration> <action>` | `GET` | `/api/groups/integrations` |
| `marvin platform integrations options <integration> <action> <input>` | `GET` | `/api/groups/integrations` |
| `marvin platform integrations errors set <integration> <code>` | `PUT` | `/api/groups/integrations/{integration}/error-overrides` |
| `marvin platform integrations errors reset <integration> <code>` | `GET` | `/api/groups/integrations` |
| `marvin platform integrations alert-routing set` | `PUT` | `/api/groups/integrations/alert-routing` |
| `marvin platform integrations subscriptions list` | `GET` | `/api/groups/integrations/subscriptions` |
| `marvin platform integrations subscriptions create` | `POST` | `/api/groups/integrations/subscriptions` |
| `marvin platform integrations subscriptions update <id>` | `PATCH` | `/api/groups/integrations/subscriptions/{id}` |
| `marvin platform integrations subscriptions delete <id>` | `DELETE` | `/api/groups/integrations/subscriptions/{id}` |

### Site

| Command | HTTP Method | Endpoint |
|---------|-------------|----------|
| `marvin platform site rebuild` | `POST` | `/api/platform/site/rebuild` |
| `marvin platform site rebuild-status` | `GET` | `/api/platform/site/rebuild` |

### Dashboard

| Command | HTTP Method | Endpoint |
|---------|-------------|----------|
| `marvin platform dashboard` | `GET` | `/api/platform/stats/dashboard` |

### Blueprints

| Command | HTTP Method | Endpoint |
|---------|-------------|----------|
| `marvin platform blueprints list` | `GET` | `/api/groups/blueprints` |
| `marvin platform blueprints categories` | `GET` | `/api/groups/blueprints/categories` |
| `marvin platform blueprints get <slug>` | `GET` | `/api/groups/blueprints/{slug}` |
| `marvin platform blueprints apply <slugs>` | `POST` | `/api/groups/blueprints/{slugs}/apply` |
| `marvin platform blueprints update <slug>` | `POST` | `/api/groups/blueprints/{slug}/update` |

### Incoming webhooks

| Command | HTTP Method | Endpoint |
|---------|-------------|----------|
| `marvin platform incoming-webhooks list` | `GET` | `/api/incoming-webhooks` |
| `marvin platform incoming-webhooks get <webhook>` | `GET` | `/api/incoming-webhooks` |
| `marvin platform incoming-webhooks signature-schemes` | `GET` | `/api/incoming-webhooks/signature-schemes` |
| `marvin platform incoming-webhooks create` | `POST` | `/api/incoming-webhooks` |
| `marvin platform incoming-webhooks update <webhook>` | `GET` | `/api/incoming-webhooks` |
| `marvin platform incoming-webhooks delete <webhook>` | `GET` | `/api/incoming-webhooks` |
| `marvin platform incoming-webhooks mint-token <webhook>` | `GET` | `/api/incoming-webhooks` |
| `marvin platform incoming-webhooks revoke-token <webhook>` | `GET` | `/api/incoming-webhooks` |

### Tags

| Command | HTTP Method | Endpoint |
|---------|-------------|----------|
| `marvin platform tags list` | `GET` | `/api/platform/tags` |
| `marvin platform tags get <tag>` | `GET` | `/api/platform/tags` |
| `marvin platform tags create` | `POST` | `/api/platform/tags` |
| `marvin platform tags update <tag>` | `GET` | `/api/platform/tags` |
| `marvin platform tags delete <tag>` | `GET` | `/api/platform/tags` |
| `marvin platform tags attach <tag>` | `POST` | `/api/platform/tags/{tag}/entries|assets|resources/{id}` |
| `marvin platform tags detach <tag>` | `DELETE` | `/api/platform/tags/{tag}/entries|assets|resources/{id}` |

### AI

| Command | HTTP Method | Endpoint |
|---------|-------------|----------|
| `marvin platform ai providers list` | `GET` | `/api/ai/providers` |
| `marvin platform ai providers get <id>` | `GET` | `/api/ai/providers/{id}` |
| `marvin platform ai providers create` | `POST` | `/api/ai/providers` |
| `marvin platform ai providers update <id>` | `PATCH` | `/api/ai/providers/{id}` |
| `marvin platform ai providers delete <id>` | `DELETE` | `/api/ai/providers/{id}` |
| `marvin platform ai providers test <id>` | `POST` | `/api/ai/providers/{id}/test` |
| `marvin platform ai providers models list <provider-id>` | `GET` | `/api/ai/providers/{provider_id}/models` |
| `marvin platform ai providers models create <provider-id>` | `POST` | `/api/ai/providers/{provider_id}/models` |
| `marvin platform ai providers models update <provider-id> <model-id>` | `PATCH` | `/api/ai/providers/{provider_id}/models/{model_id}` |
| `marvin platform ai providers models delete <provider-id> <model-id>` | `DELETE` | `/api/ai/providers/{provider_id}/models/{model_id}` |
| `marvin platform ai operations list` | `GET` | `/api/ai/operations` |
| `marvin platform ai operations get <slug>` | `GET` | `/api/ai/operations/{slug}` |
| `marvin platform ai operations execute <slug>` | `POST` | `/api/ai/operations/{slug}/execute` |
| `marvin platform ai operations reindex` | `POST` | `/api/ai/embeddings/reindex` |
| `marvin platform ai executions list` | `GET` | `/api/ai/executions` |
| `marvin platform ai executions get <id>` | `GET` | `/api/ai/executions/{id}` |
| `marvin platform ai executions delete <id>` | `DELETE` | `/api/ai/executions/{id}` |
| `marvin platform ai settings show` | `GET` | `/api/groups/ai-settings` |
| `marvin platform ai settings update` | `PATCH` | `/api/groups/ai-settings` |

## Admin API

### Users

| Command | HTTP Method | Endpoint |
|---------|-------------|----------|
| `marvin admin users list` | `GET` | `/api/admin/users?page=1&per_page=50` |
| `marvin admin users get <id>` | `GET` | `/api/admin/users/{id}` |
| `marvin admin users create` | `POST` | `/api/admin/users` |
| `marvin admin users update <id>` | `PUT` | `/api/admin/users/{id}` |
| `marvin admin users delete <id>` | `DELETE` | `/api/admin/users/{id}` |
| `marvin admin users reset-password <user-id>` | `POST` | `/api/admin/users/password-reset-token` |
| `marvin admin users unlock <user-id>` | `POST` | `/api/admin/users/unlock` |

### System

| Command | HTTP Method | Endpoint |
|---------|-------------|----------|
| `marvin admin system info` | `GET` | `/api/admin/about` |
| `marvin admin system stats` | `GET` | `/api/admin/about/statistics` |
| `marvin admin system startup-info` | `GET` | `/api/admin/about/startup-info` |
| `marvin admin system health` | `GET` | `/api/admin/about/check` |
| `marvin admin system plugins` | `GET` | `/api/admin/plugins` |

### Maintenance

| Command | HTTP Method | Endpoint |
|---------|-------------|----------|
| `marvin admin maintenance summary` | `GET` | `/api/admin/maintenance` |
| `marvin admin maintenance stats` | `GET` | `/api/admin/maintenance/stats` |
| `marvin admin maintenance storage` | `GET` | `/api/admin/maintenance/storage` |

### Backups

| Command | HTTP Method | Endpoint |
|---------|-------------|----------|
| `marvin admin backups list` | `GET` | `/api/admin/backups` |
| `marvin admin backups download <filename>` | `GET` | `/api/admin/backups/{filename}` |
| `marvin admin backups create <workspace-id>` | `POST` | `/api/admin/backups/workspaces/{workspace_id}` |
| `marvin admin backups import <workspace-id>` | `POST` | `/api/admin/backups/workspaces/{workspace_id}/import` |

### Scheduled tasks

| Command | HTTP Method | Endpoint |
|---------|-------------|----------|
| `marvin admin scheduled-tasks list` | `GET` | `/api/admin/scheduled-tasks` |
| `marvin admin scheduled-tasks log` | `GET` | `/api/admin/scheduled-tasks/log` |
| `marvin admin scheduled-tasks types` | `GET` | `/api/admin/scheduled-tasks/task-types` |
| `marvin admin scheduled-tasks get <id>` | `GET` | `/api/admin/scheduled-tasks/{id}` |
| `marvin admin scheduled-tasks run <id-or-slug>` | `GET` | `/api/admin/scheduled-tasks` |
| `marvin admin scheduled-tasks history <id>` | `GET` | `/api/admin/scheduled-tasks/{id}/history` |
| `marvin admin scheduled-tasks create` | `POST` | `/api/admin/scheduled-tasks` |
| `marvin admin scheduled-tasks update <id>` | `PATCH` | `/api/admin/scheduled-tasks/{id}` |
| `marvin admin scheduled-tasks delete <id>` | `DELETE` | `/api/admin/scheduled-tasks/{id}` |

### Email

| Command | HTTP Method | Endpoint |
|---------|-------------|----------|
| `marvin admin email settings` | `GET` | `/api/admin/email` |
| `marvin admin email test <email>` | `POST` | `/api/admin/email` |
| `marvin admin email templates list` | `GET` | `/api/admin/email/templates` |
| `marvin admin email templates get <id>` | `GET` | `/api/admin/email/templates/{id}` |
| `marvin admin email templates create` | `POST` | `/api/admin/email/templates` |
| `marvin admin email templates update <id>` | `PATCH` | `/api/admin/email/templates/{id}` |
| `marvin admin email templates test <id> <email>` | `POST` | `/api/admin/email/templates/{id}/test` |
| `marvin admin email templates delete <id>` | `DELETE` | `/api/admin/email/templates/{id}` |

### Groups

| Command | HTTP Method | Endpoint |
|---------|-------------|----------|
| `marvin admin groups list` | `GET` | `/api/admin/groups?page=1&perPage=50` |
| `marvin admin groups create` | `POST` | `/api/admin/groups` |
| `marvin admin groups get <id>` | `GET` | `/api/admin/groups/{id}` |
| `marvin admin groups update <id>` | `PUT` | `/api/admin/groups/{id}` |
| `marvin admin groups delete <id>` | `DELETE` | `/api/admin/groups/{id}` |

### Workspace members

| Command | HTTP Method | Endpoint |
|---------|-------------|----------|
| `marvin admin workspace-members list <workspace-id>` | `GET` | `/api/admin/workspaces/{workspace_id}/members` |
| `marvin admin workspace-members get <workspace-id> <user-id>` | `GET` | `/api/admin/workspaces/{workspace_id}/members/{user_id}` |
| `marvin admin workspace-members add <workspace-id>` | `POST` | `/api/admin/workspaces/{workspace_id}/members` |
| `marvin admin workspace-members update-role <workspace-id> <user-id>` | `PUT` | `/api/admin/workspaces/{workspace_id}/members/{user_id}` |
| `marvin admin workspace-members remove <workspace-id> <user-id>` | `DELETE` | `/api/admin/workspaces/{workspace_id}/members/{user_id}` |

## Events and system

### Events

| Command | HTTP Method | Endpoint |
|---------|-------------|----------|
| `marvin events list` | `GET + GET` | `/api/platform/event-types/connections`; then `/api/event/types` |
| `marvin events show <event-type>` | `GET` | `/api/platform/event-types/{event_type}/connections?limit=10` |

### System

| Command | HTTP Method | Endpoint |
|---------|-------------|----------|
| `marvin system health` | `GET` | `/api/app/health (no token needed)` |
| `marvin system version` | - | (local: prints the CLI version) |

## Authentication Headers

### Site client token

```http
Authorization: Bearer marvin_sk_your_token
```

Used by every `publish` command.

```bash
curl -H "Authorization: Bearer $MARVIN_SITE_CLIENT_TOKEN" \
     "$MARVIN_API_URL/api/publish/my-workspace/entries?limit=10"
```

### User token

```http
Authorization: Bearer <user token>
```

Used by `platform`, `admin`, `user`, `events` and `workspace` commands. Get one with `marvin login`
or create a personal token with `marvin user tokens create`; the CLI reads it from
`MARVIN_USER_TOKEN` or the saved credentials.

```bash
curl -H "Authorization: Bearer $MARVIN_USER_TOKEN" \
     "$MARVIN_API_URL/api/self/workspaces"
```

## Response shape

Publishing list endpoints answer with `data` and pagination `meta`:

```json
{
  "data": [ ... ],
  "meta": { "total": 57, "page": 1, "limit": 20, "offset": 0 }
}
```

## Replicating a CLI call

```bash
API_URL="https://api.example.com"
WORKSPACE="my-workspace"
TOKEN="marvin_sk_token"

# marvin publish collections --limit 100 --offset 100
curl -v \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/json" \
  "$API_URL/api/publish/$WORKSPACE/collections?limit=100&offset=100"
```

## Related

- [Commands Overview](../commands/overview.md)
- [Authentication Reference](authentication.md)
- [Error Handling](error-handling.md)
- [Publishing API Commands](../commands/site.md)
