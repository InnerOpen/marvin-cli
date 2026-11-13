/**
 * `marvin platform workers setup` against a mocked SDK: it applies core's three Workers blueprints, says what was added, and
 * is quiet and idempotent when they are already there.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { Command } from 'commander'
import { createPlatformCommand } from '../commands/platform/index.js'
import { clientFactory } from '../shared/clients.js'
import { resetCommandContext, trackCommandContext } from '../shared/command-context.js'
import { captureOutput, type Captured } from './helpers/capture.js'

vi.mock('../shared/clients.js', () => ({
  clientFactory: { createPlatformClient: vi.fn() },
  ClientFactory: class {},
}))

const result = (slug: string, created: boolean, extra: Record<string, unknown> = {}) => ({ slug, kind: 'entry_type', name: slug, created, updated: false, detail: '', ...extra })

function buildProgram(): Command {
  const program = new Command('marvin')
    .exitOverride()
    .option('--output <format>', 'Output format', 'table')
    .option('--json', 'JSON output', false)
    .option('--yaml', 'YAML output', false)
    .option('--csv', 'CSV output', false)
  trackCommandContext(program)
  program.addCommand(createPlatformCommand())
  return program
}

const run = (...args: string[]) => buildProgram().parseAsync(['node', 'marvin', 'platform', 'workers', ...args])

describe('platform workers setup', () => {
  let io: Captured
  let blueprints: any

  beforeEach(() => {
    resetCommandContext()
    io = captureOutput()
    blueprints = { applyMany: vi.fn() }
    vi.mocked(clientFactory.createPlatformClient).mockResolvedValue({ blueprints } as any)
  })
  afterEach(() => { vi.restoreAllMocks() })

  it('applies the three core Workers blueprints and points at the next step', async () => {
    blueprints.applyMany.mockResolvedValue([result('job', true), result('job-kind', true), result('worker', true)])
    await run('setup')
    expect(blueprints.applyMany).toHaveBeenCalledWith(['job', 'job-kind', 'worker'], undefined, { source: 'core' })
    expect(io.err()).toContain('Added 3 of 3 record type(s)')
    expect(io.err()).toContain('marvin user tokens create --name worker --pin')
  })

  it('says so, and gives no next steps, when everything was already there', async () => {
    blueprints.applyMany.mockResolvedValue([result('job', false), result('job-kind', false), result('worker', false)])
    await run('setup')
    expect(io.err()).toContain('already set up for workers')
    expect(io.err()).not.toContain('Next:')
  })

  it('does not call a same-named type with other fields "set up": it says so and exits 1', async () => {
    blueprints.applyMany.mockResolvedValue([
      result('job', false, { fits: false, detail: 'a entry type with slug job already exists — left as it is, but it lacks fields this one defines: kind, status' }),
      result('job-kind', true),
      result('worker', true),
    ])
    process.exitCode = undefined
    await run('setup')
    expect(io.err()).toContain('1 existing record type(s) are not the ones workers use')
    expect(io.err()).not.toContain('already set up')
    expect(io.err()).not.toContain('Next:')
    expect(process.exitCode).toBe(1)
    process.exitCode = undefined
  })

  it('prints the results as JSON when asked', async () => {
    blueprints.applyMany.mockResolvedValue([result('job', true)])
    await buildProgram().parseAsync(['node', 'marvin', '--json', 'platform', 'workers', 'setup'])
    expect(JSON.parse(io.out())[0].slug).toBe('job')
  })
})
