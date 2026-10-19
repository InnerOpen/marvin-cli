/**
 * `marvin admin groups delete` against a mocked SDK: the confirm_name / skip_backup / force params
 * the server's delete safety checks need, and the messages for its refusals.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { Command } from 'commander'
import { MarvinApiError } from '@inneropen/marvin-sdk'
import { createAdminCommand } from '../commands/admin/index.js'
import { clientFactory } from '../shared/clients.js'
import { resetCommandContext, trackCommandContext } from '../shared/command-context.js'
import { captureOutput, type Captured } from './helpers/capture.js'

vi.mock('../shared/clients.js', () => ({
  clientFactory: { createPlatformClient: vi.fn() },
  ClientFactory: class {},
}))

function buildProgram(): Command {
  const program = new Command('marvin')
    .exitOverride()
    .option('--output <format>', 'Output format', 'table')
    .option('--json', 'JSON output', false)
    .option('--yaml', 'YAML output', false)
    .option('--csv', 'CSV output', false)
  trackCommandContext(program)
  program.addCommand(createAdminCommand())
  return program
}

const run = (...args: string[]) =>
  buildProgram().parseAsync(['node', 'marvin', 'admin', 'groups', 'delete', ...args])

function apiError(status: number, detail: unknown): MarvinApiError {
  return new MarvinApiError('request failed', status, '/api/admin/groups/ws-1', JSON.stringify({ detail }))
}

describe('admin groups delete', () => {
  let io: Captured
  let workspaces: { get: ReturnType<typeof vi.fn>; delete: ReturnType<typeof vi.fn> }

  beforeEach(() => {
    resetCommandContext()
    io = captureOutput()
    workspaces = {
      get: vi.fn().mockResolvedValue({ id: 'ws-1', name: 'My Space' }),
      delete: vi.fn().mockResolvedValue(undefined),
    }
    vi.mocked(clientFactory.createPlatformClient).mockResolvedValue({ workspaces } as any)
  })

  afterEach(() => {
    vi.restoreAllMocks()
    process.exitCode = 0
  })

  it('requires --yes and does not call the API without it', async () => {
    await run('ws-1')
    expect(workspaces.delete).not.toHaveBeenCalled()
    expect(workspaces.get).not.toHaveBeenCalled()
    expect(io.err()).toContain('--yes')
    expect(process.exitCode).toBe(1)
  })

  it('with --yes only, confirms with the workspace name looked up by id', async () => {
    await run('ws-1', '--yes')
    expect(workspaces.get).toHaveBeenCalledWith('ws-1')
    expect(workspaces.delete).toHaveBeenCalledWith('ws-1', { force: false, confirmName: 'My Space', skipBackup: false })
    expect(io.out() + io.err()).toContain('Deleted group: ws-1')
    expect(process.exitCode ?? 0).toBe(0)
  })

  it('--confirm-name is sent as given, without a lookup', async () => {
    await run('ws-1', '--yes', '--confirm-name', 'Typed Name')
    expect(workspaces.get).not.toHaveBeenCalled()
    expect(workspaces.delete).toHaveBeenCalledWith('ws-1', { force: false, confirmName: 'Typed Name', skipBackup: false })
  })

  it('passes --force and --skip-backup through', async () => {
    await run('ws-1', '--yes', '--force', '--skip-backup')
    expect(workspaces.delete).toHaveBeenCalledWith('ws-1', { force: true, confirmName: 'My Space', skipBackup: true })
  })

  it('explains a 409 backup_required and points at backups create and --skip-backup', async () => {
    workspaces.delete.mockRejectedValue(apiError(409, {
      code: 'backup_required',
      message: 'Back up the workspace first (a bundle from the last 24 hours), or delete without a backup.',
      last_backup_at: null,
    }))
    await run('ws-1', '--yes')
    const err = io.err()
    expect(err).toContain('marvin admin backups create ws-1')
    expect(err).toContain('--skip-backup')
    expect(err).not.toContain('already exist')
    expect(process.exitCode).toBe(1)
  })

  it('explains a 400 confirm_name_mismatch', async () => {
    workspaces.delete.mockRejectedValue(apiError(400, {
      code: 'confirm_name_mismatch',
      message: "Type the workspace's name exactly to confirm the delete.",
    }))
    await run('ws-1', '--yes', '--confirm-name', 'wrong')
    expect(io.err()).toContain('--confirm-name')
    expect(process.exitCode).toBe(1)
  })

  it('reports the refusal as data with --json', async () => {
    workspaces.delete.mockRejectedValue(apiError(409, { code: 'backup_required', message: 'Back up first.' }))
    await run('ws-1', '--yes', '--json')
    expect(JSON.parse(io.out()).error).toContain('--skip-backup')
    expect(process.exitCode).toBe(1)
  })
})
