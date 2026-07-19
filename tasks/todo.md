# CLI Full-Coverage Update — Plan

Goal: bring `@inneropen/marvin-cli` to full coverage of the Marvin backend (233 ops).
Source of truth: fresh offline OpenAPI (regenerated 2026-07-17) → `MarvinSDK/src/generated/schema.ts`.

Gap matrix: 146 already covered · 55 Bucket A (SDK exists, add CLI cmd) · 21 Bucket B (add SDK + CLI) · 11 Bucket C (excluded).

## Phase 1 — Schemas (DONE)
- [x] Generate OpenAPI offline from `marvin.app:app` (no server/DB needed)
- [x] Regenerate `MarvinSDK/src/generated/schema.ts` (+1522 lines drift captured)
- [x] SDK typecheck + build green; CLI baseline build + 120 tests green

## Phase 2 — SDK Bucket-B methods (prerequisite for CLI)
- [ ] ai/operations.ts: `reindex()`
- [ ] user.ts: `getApiToken(id)`, `updateApiToken(id,data)`
- [ ] notifications.ts: `log(opts)`, `logs(id,opts)`
- [ ] webhooks.ts: `types()`
- [ ] workspaces.ts: `createBackup()`
- [ ] emailTemplates.ts: `getEventConnections(groupId)`
- [ ] admin/system.ts: `sendTestEmail`, `createEmailTemplate`, `deleteEmailTemplate`
- [ ] admin/users.ts: `create(UserCreate)`
- [ ] admin/scheduledTasks.ts: `create`, `update`, `delete`
- [ ] admin/workspaces.ts: `addMember`, `getMember`, `updateMember`
- [ ] admin groups `list()` (GET /api/admin/groups → GroupPagination)
- [ ] admin/maintenance.ts: `getSummary()`
- [ ] Rebuild SDK dist; typecheck green

## Phase 3 — CLI: AI group (NEW)
- [ ] ai/providers.ts (10) · ai/operations.ts (7) · ai/settings.ts (2) · ai/index.ts
- [ ] Register `createAiCommand()` in src/index.ts (gate on user token)

## Phase 4 — CLI: complete admin group
- [ ] admin/backups.ts (4) · scheduled-tasks.ts (9) · email.ts (8) · groups.ts (5) · workspace-members.ts (5)
- [ ] extend users.ts (+3), system.ts (+1), maintenance.ts (+1); wire admin/index.ts

## Phase 5 — CLI: platform / user / auth fills
- [ ] platform/email.ts (5, NEW); extend workspaces (+4), assets (+1), collections (+1), notifications (+2), webhooks (+1), email-templates (+1)
- [ ] user/tokens.ts (+2); auth.ts (+3, wire AuthClient into clientFactory)

## Phase 6 — Verify
- [ ] CLI build clean; `npm test` green
- [ ] `marvin --help` and each new group `--help` list all commands
- [ ] Update README/docs command reference

## Review

**Outcome:** CLI now covers the full backend surface. Build clean, `npm test` 156/156 (was 120 — the dynamic output-format harness auto-discovered the new list commands).

**What landed:**
- Phase 1: regenerated `MarvinSDK/src/generated/schema.ts` from offline OpenAPI (+1522 lines of drift). SDK typecheck+build green.
- Phase 2: 20 SDK methods added (11 files) for the 21 Bucket-B endpoints; each matched to exact OpenAPI path/verb. Admin-groups list → `platform.workspaces.listAdminGroups()`.
- Phase 3: AI group (19 cmds) — `platform ai {providers[.models],operations,executions,settings}`. Nested under `platform` (mirrors SDK `platform.ai.*`), not top-level.
- Phase 4: admin group completed — 5 new subgroups (backups, scheduled-tasks, email, groups, workspace-members) + users/system/maintenance extensions.
- Phase 5: platform/email (new) + extensions to workspaces (stats, backups), assets (download), collections (update-entry), notifications (log/logs), webhooks (types), email-templates (event-connections); user tokens (get/update); public auth (register/forgot-password/reset-password) via new `clientFactory.createAuthClient()`.

**Command tree:** 195 leaf commands across platform/admin/user/system (+ publish/workspace/auth top-level). All new groups render via `--help` with no registration errors.

**Test-harness change reviewed & approved:** `output-format.test.ts` mock made nested-namespace-aware (bounded to depth 4 for `ai.providers.models.list`) + real camelCase fixture fields added. Sound; not masking drift.

**Intentional skips:** Bucket C (11 — `/api/app/*` UI metadata, raw auth/oauth/refresh/logout browser flows handled by login/logout, deprecated `/api/event/options`). Priority-5 `publish asset-download` deferred (needs a `getFile` on the publishing AssetsModule; low value).

**Dependency note:** CLI `node_modules/@inneropen/marvin-sdk` is a symlink to local MarvinSDK and imports from `dist/`. SDK changes require `npm run build` in MarvinSDK before the CLI sees them. Verified green against current SDK dist; a concurrent SDK edit may warrant a re-verify.

**Follow-ups (not done):** README/mkdocs command reference not yet updated for the new commands.

## Phase 7 — Coverage-drift gate (added)
- `src/__tests__/coverage-drift.test.ts` — runs in `npm test`. Fails if any backend operation in the committed snapshot isn't classified in the manifest (new endpoint), if a manifest entry no longer exists (removed endpoint), on double-classification, or if the full CLI command tree fails to build.
- `src/__tests__/backend-operations.json` — snapshot of all 233 backend ops.
- `src/__tests__/api-coverage-manifest.json` — classification: 221 covered / 11 excluded / 1 deferred.
- `scripts/refresh-backend-operations.mjs` + `npm run coverage:refresh` — regenerate the snapshot offline from ../Marvin (or from a passed openapi.json) and diff against the manifest.
- Fixed a latent bug: vitest was running BOTH src and compiled `dist/` test copies (inflating counts ~2×); scoped vitest to `src/**/*.test.ts`. Real suite = 82 tests.
- Verified the gate: injecting a fake endpoint fails it with a naming message; restore → green.

**Note on scope of the gate:** catches coverage drift (new/removed endpoints) and registration errors. It does NOT verify runtime correctness (paths/verbs/response shapes) — CLI tests mock the SDK, so a live smoke test is still needed for that. The snapshot is only as fresh as the last `coverage:refresh`.
