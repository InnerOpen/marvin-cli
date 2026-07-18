/**
 * API coverage drift gate.
 *
 * Ensures every backend operation is explicitly accounted for — either wrapped
 * by a CLI command (`covered`), intentionally skipped (`excluded`), or knowingly
 * postponed (`deferred`). A backend endpoint that appears in the committed
 * OpenAPI snapshot but is NOT in the manifest fails this test, forcing whoever
 * bumped the snapshot to classify (and usually wire) the new endpoint.
 *
 * Data sources (committed, so this test needs no running backend):
 *   - backend-operations.json     — snapshot of every "METHOD /api/path" the
 *                                    backend exposes. Refresh with
 *                                    `npm run coverage:refresh`.
 *   - api-coverage-manifest.json   — human-maintained classification of each op.
 *
 * This catches coverage DRIFT (new / removed endpoints). It does NOT verify
 * runtime correctness — the CLI unit tests mock the SDK, so a live smoke test
 * against a real backend is still needed for that.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { Command } from 'commander'

import { createPublishCommand } from '../commands/publish/index.js'
import { createPlatformCommand } from '../commands/platform/index.js'
import { createSystemCommand } from '../commands/system/index.js'
import { createAdminCommand } from '../commands/admin/index.js'
import { createUserCommand } from '../commands/user/index.js'
import { registerAuthCommands } from '../commands/auth.js'
import { registerWorkspaceCommands } from '../commands/platform/workspaces.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

function load<T>(file: string): T {
  return JSON.parse(readFileSync(join(__dirname, file), 'utf-8')) as T
}

interface Manifest {
  excluded: Record<string, string>
  deferred: Record<string, string>
  covered: string[]
}

const operations = load<string[]>('backend-operations.json')
const manifest = load<Manifest>('api-coverage-manifest.json')

const accountedFor = new Set<string>([
  ...manifest.covered,
  ...Object.keys(manifest.excluded),
  ...Object.keys(manifest.deferred),
])

/**
 * Rebuild the full command tree exactly as src/index.ts wires it (minus the
 * process/env side effects), so a registration error in ANY group is caught.
 */
function buildFullProgram(): Command {
  const program = new Command('marvin')
  registerAuthCommands(program)
  registerWorkspaceCommands(program, { hidden: false })
  program.addCommand(createPublishCommand())
  program.addCommand(createPlatformCommand())
  program.addCommand(createAdminCommand())
  program.addCommand(createUserCommand())
  program.addCommand(createSystemCommand())
  return program
}

function leafCommandPaths(cmd: Command, path: string[] = []): string[] {
  const out: string[] = []
  const subs = cmd.commands.filter((c) => c.name() !== 'help')
  if (path.length && subs.length === 0) return [path.join(' ')]
  for (const sub of subs) out.push(...leafCommandPaths(sub, [...path, sub.name()]))
  return out
}

describe('API coverage drift', () => {
  it('every backend operation is classified in the manifest (no unaccounted endpoints)', () => {
    const unaccounted = operations.filter((op) => !accountedFor.has(op))
    expect(
      unaccounted,
      `New/unclassified backend endpoint(s). Add each to src/__tests__/api-coverage-manifest.json ` +
        `under "covered" (and wire a CLI command) or "excluded"/"deferred" (with a reason):\n  ` +
        unaccounted.join('\n  '),
    ).toEqual([])
  })

  it('every manifest entry still exists in the backend (no stale classifications)', () => {
    const known = new Set(operations)
    const stale = [...accountedFor].filter((op) => !known.has(op))
    expect(
      stale,
      `Manifest references endpoint(s) the backend no longer exposes. Remove them from ` +
        `src/__tests__/api-coverage-manifest.json (refresh the snapshot first):\n  ` +
        stale.join('\n  '),
    ).toEqual([])
  })

  it('an operation is classified under exactly one status', () => {
    const excluded = new Set(Object.keys(manifest.excluded))
    const deferred = new Set(Object.keys(manifest.deferred))
    const covered = new Set(manifest.covered)
    const overlaps: string[] = []
    for (const op of operations) {
      const hits = [covered.has(op), excluded.has(op), deferred.has(op)].filter(Boolean).length
      if (hits > 1) overlaps.push(op)
    }
    expect(overlaps, `Operation(s) classified under multiple statuses:\n  ${overlaps.join('\n  ')}`).toEqual([])
  })

  it('the full CLI command tree builds without a registration error', () => {
    const program = buildFullProgram()
    const leaves = leafCommandPaths(program)
    // Sanity floor — the tree currently has ~200 leaf commands across all groups.
    expect(leaves.length).toBeGreaterThan(150)
  })
})
