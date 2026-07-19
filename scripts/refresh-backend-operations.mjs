#!/usr/bin/env node
/**
 * Refresh src/__tests__/backend-operations.json — the committed snapshot of every
 * backend operation the CLI is measured against by the coverage-drift test.
 *
 * Usage:
 *   node scripts/refresh-backend-operations.mjs [path/to/openapi.json]
 *
 * With no argument it generates the OpenAPI offline from the Marvin backend
 * (expected as a sibling checkout at ../Marvin) via:
 *   uv run python -c "import json;from marvin.app import app;print(json.dumps(app.openapi()))"
 * (no running server or DB required — app.openapi() only reads route metadata).
 *
 * After refreshing, run `npm test` (or `npm run coverage:refresh` prints a diff):
 * any newly added endpoint will fail the drift gate until it is classified in
 * src/__tests__/api-coverage-manifest.json.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const HTTP_METHODS = new Set(['get', 'post', 'put', 'patch', 'delete', 'head', 'options'])
const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const OPS_FILE = join(repoRoot, 'src/__tests__/backend-operations.json')
const MANIFEST_FILE = join(repoRoot, 'src/__tests__/api-coverage-manifest.json')

function loadOpenApi() {
  const argPath = process.argv[2]
  if (argPath) {
    console.log(`Reading OpenAPI from ${argPath}`)
    return JSON.parse(readFileSync(argPath, 'utf-8'))
  }
  const marvinDir = resolve(repoRoot, '../Marvin')
  if (!existsSync(marvinDir)) {
    console.error(
      `No OpenAPI path given and the Marvin backend was not found at ${marvinDir}.\n` +
        `Pass a path: node scripts/refresh-backend-operations.mjs path/to/openapi.json`,
    )
    process.exit(1)
  }
  console.log(`Generating OpenAPI offline from ${marvinDir} (uv run)...`)
  const py = 'import json,sys;from marvin.app import app;sys.stdout.write(json.dumps(app.openapi()))'
  const out = execFileSync('uv', ['run', 'python', '-c', py], {
    cwd: marvinDir,
    encoding: 'utf-8',
    maxBuffer: 64 * 1024 * 1024,
    stdio: ['ignore', 'pipe', 'inherit'],
  })
  return JSON.parse(out)
}

function extractOperations(openapi) {
  const ops = []
  for (const [path, item] of Object.entries(openapi.paths ?? {})) {
    for (const method of Object.keys(item)) {
      if (HTTP_METHODS.has(method.toLowerCase())) ops.push(`${method.toUpperCase()} ${path}`)
    }
  }
  return [...new Set(ops)].sort()
}

const openapi = loadOpenApi()
const ops = extractOperations(openapi)

const previous = existsSync(OPS_FILE) ? JSON.parse(readFileSync(OPS_FILE, 'utf-8')) : []
const prevSet = new Set(previous)
const nextSet = new Set(ops)
const added = ops.filter((o) => !prevSet.has(o))
const removed = previous.filter((o) => !nextSet.has(o))

writeFileSync(OPS_FILE, JSON.stringify(ops, null, 2) + '\n')
console.log(`\nWrote ${ops.length} operations to src/__tests__/backend-operations.json`)

if (existsSync(MANIFEST_FILE)) {
  const manifest = JSON.parse(readFileSync(MANIFEST_FILE, 'utf-8'))
  const accounted = new Set([
    ...(manifest.covered ?? []),
    ...Object.keys(manifest.excluded ?? {}),
    ...Object.keys(manifest.deferred ?? {}),
  ])
  const unclassified = ops.filter((o) => !accounted.has(o))
  const stale = [...accounted].filter((o) => !nextSet.has(o))
  if (added.length) console.log(`\nNEW endpoints (${added.length}):\n  ${added.join('\n  ')}`)
  if (removed.length) console.log(`\nREMOVED endpoints (${removed.length}):\n  ${removed.join('\n  ')}`)
  if (unclassified.length)
    console.log(
      `\n⚠ ${unclassified.length} endpoint(s) NOT in the manifest — classify them in ` +
        `src/__tests__/api-coverage-manifest.json (covered / excluded / deferred):\n  ${unclassified.join('\n  ')}`,
    )
  if (stale.length)
    console.log(`\n⚠ ${stale.length} stale manifest entr(y/ies) — remove from the manifest:\n  ${stale.join('\n  ')}`)
  if (!unclassified.length && !stale.length) console.log('\n✓ Manifest is in sync with the backend.')
} else {
  console.log('\nNo manifest found — create src/__tests__/api-coverage-manifest.json.')
}
