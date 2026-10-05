/**
 * `marvin platform workflows` against a mocked SDK: slug resolution, run vs dry run, run
 * history filtering, the run detail view, and validate's exit code.
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

const WF_ID = '11111111-2222-4333-8444-555555555555'
const WORKFLOW = {
  id: WF_ID,
  groupId: 'g1',
  name: 'Tag new posts',
  slug: 'tag-new-posts',
  enabled: true,
  definition: { trigger: { type: 'event', event: 'entry_published' }, actions: [{ kind: 'operation', op: 'generate_tags' }] },
  createdBy: null,
}

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

async function run(...args: string[]): Promise<void> {
  await buildProgram().parseAsync(['node', 'marvin', 'platform', 'workflows', ...args])
}

describe('platform workflows', () => {
  let io: Captured
  let automations: any

  beforeEach(() => {
    resetCommandContext()
    io = captureOutput()
    automations = {
      list: vi.fn().mockResolvedValue([WORKFLOW]),
      get: vi.fn().mockResolvedValue(WORKFLOW),
      create: vi.fn().mockResolvedValue({ ...WORKFLOW, enabled: false }),
      update: vi.fn().mockImplementation((_id, body) => Promise.resolve({ ...WORKFLOW, ...body })),
      delete: vi.fn().mockResolvedValue(undefined),
      run: vi.fn().mockResolvedValue({ status: 'ran', ok: true, ran: 2, result: {} }),
      dryRun: vi.fn().mockResolvedValue({
        status: 'dry_run', ok: true, ran: 1, dry_run: true,
        plan: [{ target_index: 0, target: { type: 'entry', id: 'e1' }, action_index: 0, kind: 'operation', status: 'success' }],
        sample: { kind: 'entry', id: 'e1', label: 'Hello' }, trigger_matched: true, would_fire: true,
      }),
      executions: vi.fn().mockResolvedValue([
        { id: 'x1', automationSlug: 'tag-new-posts', triggerType: 'event', status: 'success', targetsMatched: 1, targetsRun: 1, capped: false, stepsTotal: 1, stepsOk: 1, stepsFailed: 0 },
        { id: 'x2', automationSlug: 'tag-new-posts', triggerType: 'event', status: 'failed', targetsMatched: 1, targetsRun: 1, capped: false, stepsTotal: 1, stepsOk: 0, stepsFailed: 1, handled: true },
      ]),
      execution: vi.fn(),
      validate: vi.fn().mockResolvedValue({ issues: [] }),
      preview: vi.fn(),
      options: vi.fn().mockResolvedValue({ triggerTypes: ['event'] }),
    }
    vi.mocked(clientFactory.createPlatformClient).mockResolvedValue({ automations } as any)
  })

  afterEach(() => {
    vi.restoreAllMocks()
    process.exitCode = 0
  })

  it('lists workflows with their trigger', async () => {
    await run('list')
    expect(io.tables[0]).toEqual([
      { ID: WF_ID, Slug: 'tag-new-posts', Name: 'Tag new posts', Enabled: true, Trigger: 'event: entry_published', Steps: 1 },
    ])
  })

  it('accepts a slug wherever it takes a workflow', async () => {
    await run('get', 'tag-new-posts', '--json')
    expect(automations.list).toHaveBeenCalled()
    expect(automations.get).toHaveBeenCalledWith(WF_ID)
    expect(JSON.parse(io.out())).toMatchObject({ slug: 'tag-new-posts' })
  })

  it('skips the lookup for an id', async () => {
    await run('get', WF_ID, '--json')
    expect(automations.list).not.toHaveBeenCalled()
  })

  it('reports an unknown slug', async () => {
    await run('get', 'nope')
    expect(process.exitCode).toBe(1)
    expect(io.err()).toContain("No workflow with id or slug 'nope'")
  })

  it('creates from --data and warns that the workflow starts disabled', async () => {
    await run('create', '--data', '{"name":"Tag new posts"}', '--json')
    expect(automations.create).toHaveBeenCalledWith({ name: 'Tag new posts' })
    expect(JSON.parse(io.out())).toMatchObject({ enabled: false })
    expect(io.err()).toMatch(/disabled; enable it to run/)
  })

  it('enables and disables through update', async () => {
    await run('enable', WF_ID, '--json')
    expect(automations.update).toHaveBeenCalledWith(WF_ID, { enabled: true })
    await run('disable', WF_ID, '--json')
    expect(automations.update).toHaveBeenLastCalledWith(WF_ID, { enabled: false })
  })

  it('deletes with --yes and prints {"deleted": id}', async () => {
    await run('delete', 'tag-new-posts', '--yes', '--json')
    expect(automations.delete).toHaveBeenCalledWith(WF_ID)
    expect(JSON.parse(io.out())).toEqual({ deleted: WF_ID })
  })

  it('runs for real without --dry-run', async () => {
    await run('run', WF_ID, '--json')
    expect(automations.run).toHaveBeenCalledWith(WF_ID)
    expect(automations.dryRun).not.toHaveBeenCalled()
    expect(JSON.parse(io.out())).toMatchObject({ ok: true, status: 'ran', ran: 2 })
  })

  it('dry-runs against a chosen sample', async () => {
    await run('run', WF_ID, '--dry-run', '--entry-id', 'e1')
    expect(automations.dryRun).toHaveBeenCalledWith(WF_ID, { entryId: 'e1', eventId: undefined })
    expect(automations.run).not.toHaveBeenCalled()
    expect(io.err()).toContain('Would fire: yes')
    expect(io.tables[0]).toEqual([{ Target: 'entry e1', Step: 0, Kind: 'operation', Label: '', Status: 'success', Error: '' }])
  })

  it('refuses a sample without --dry-run, before calling the API', async () => {
    await run('run', WF_ID, '--event-id', 'ev1')
    expect(process.exitCode).toBe(1)
    expect(io.err()).toContain('add --dry-run')
    expect(automations.run).not.toHaveBeenCalled()
  })

  it('a failed run exits 1', async () => {
    automations.run.mockResolvedValue({ status: 'ran', ok: false, ran: 1, result: {} })
    await run('run', WF_ID)
    expect(process.exitCode).toBe(1)
  })

  it('filters run history by status, including handled', async () => {
    await run('executions', WF_ID, '--status', 'failed', '--limit', '5', '--json')
    expect(automations.executions).toHaveBeenCalledWith(WF_ID, 5)
    expect(JSON.parse(io.out()).map((r: { id: string }) => r.id)).toEqual(['x2'])

    io.clear()
    resetCommandContext()
    await run('executions', WF_ID, '--status', 'handled', '--json')
    expect(JSON.parse(io.out()).map((r: { id: string }) => r.id)).toEqual(['x2'])
  })

  it('shows a run with its steps, handling and retry chain', async () => {
    automations.execution.mockResolvedValue({
      id: 'x2', automationSlug: 'tag-new-posts', triggerType: 'event', status: 'failed', handled: true,
      targetsMatched: 1, targetsRun: 1, capped: false, stepsTotal: 1, stepsOk: 0, stepsFailed: 1,
      retryOfId: 'x1', durationMs: 1500,
      actions: [{
        id: 'a1', targetIndex: 0, targetEntityType: 'entry', targetEntityId: 'e1', actionIndex: 0, kind: 'integration',
        label: 'Post to Slack', status: 'failed', error: 'rate limited', durationMs: 12,
        handling: { code: 'rate_limited', summary: 'queued a retry' },
      }],
      retryChain: [{ id: 'x1', automationSlug: 'tag-new-posts', triggerType: 'event', status: 'failed', targetsMatched: 1, targetsRun: 1, capped: false, stepsTotal: 1, stepsOk: 0, stepsFailed: 1 }],
      retries: [{ id: 'r1', status: 'pending', integrationSlug: 'slack', action: 'post', code: 'rate_limited', stepIndex: 0, attempt: 1, maxAttempts: 3, nextAttemptAt: '2026-10-05T12:00:00Z' }],
    })
    await run('execution', WF_ID, 'x2')
    expect(automations.execution).toHaveBeenCalledWith(WF_ID, 'x2')
    const out = io.out()
    expect(out).toContain('Status:   failed (handled)')
    expect(out).toContain('Retry of: x1')
    expect(io.tables[0]).toEqual([expect.objectContaining({ Target: 'entry e1', Status: 'failed', Handling: 'queued a retry' })])
    expect(io.tables[1]).toEqual([expect.objectContaining({ ID: 'x1', Status: 'failed' })])
    expect(io.tables[2]).toEqual([expect.objectContaining({ ID: 'r1', Integration: 'slack', Attempt: '1/3' })])
  })

  it('validates a saved workflow and exits 1 on an error-level issue', async () => {
    automations.validate.mockResolvedValue({ issues: [{ level: 'error', message: 'entry.* under a webhook trigger', where: 'condition', index: 0 }] })
    await run('validate', 'tag-new-posts')
    expect(automations.validate).toHaveBeenCalledWith(WORKFLOW.definition)
    expect(io.tables[0]).toEqual([{ Level: 'error', Where: 'condition', Index: 0, Message: 'entry.* under a webhook trigger' }])
    expect(process.exitCode).toBe(1)
  })

  it('validates a definition from --data, unwrapping a workflow body', async () => {
    await run('validate', '--data', '{"name":"x","definition":{"trigger":{"type":"manual"}}}')
    expect(automations.validate).toHaveBeenCalledWith({ trigger: { type: 'manual' } })
    expect(io.err()).toContain('No issues')
    expect(process.exitCode ?? 0).toBe(0)
  })

  it('previews a definition with a test payload', async () => {
    automations.preview.mockResolvedValue({ hasTarget: true, entity: 'entry', total: 3, capped: false, matches: [{ id: 'e1', title: 'Hi' }] })
    await run('preview', WF_ID, '--payload', '{"x":1}')
    expect(automations.preview).toHaveBeenCalledWith(WORKFLOW.definition, { x: 1 })
    expect(io.err()).toContain('3 entry(s) match')
    expect(io.tables[0]).toEqual([{ ID: 'e1', Type: '', Status: '', Title: 'Hi', Slug: '' }])
  })

  it('is also reachable as "automations"', async () => {
    await buildProgram().parseAsync(['node', 'marvin', 'platform', 'automations', 'list', '--json'])
    expect(JSON.parse(io.out())).toHaveLength(1)
  })
})
