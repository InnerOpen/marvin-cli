/**
 * 403 handling: the backend refuses a command because of the caller's workspace role.
 *
 * The SDK raises a MarvinAuthError(403) without the response body, so the CLI names the role
 * from its own table (shared/permissions.ts) and the workspace from the running command.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { Command } from 'commander'
import { writeFileSync, mkdtempSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { MarvinApiError, MarvinAuthError } from '@inneropen/marvin-sdk'
import { createPlatformCommand } from '../commands/platform/index.js'
import { createAdminCommand } from '../commands/admin/index.js'
import { registerWorkspaceCommands } from '../commands/platform/workspaces.js'
import { clientFactory } from '../shared/clients.js'
import { trackCommandContext, commandPath, resetCommandContext } from '../shared/command-context.js'
import { captureOutput, type Captured } from './helpers/capture.js'
import { REQUIRED_ROLES, requiredRoleFor, describePermissionDenied, annotateRequiredRoles } from '../shared/permissions.js'
import { handleCommandError } from '../shared/error-handler.js'

vi.mock('../shared/clients.js', () => ({
  clientFactory: {
    createPlatformClient: vi.fn(),
    createPublishClient: vi.fn(),
  },
  ClientFactory: class {},
}))

const activeWorkspace = vi.hoisted(() => ({ slug: undefined as string | undefined }))
vi.mock('../config/credentials.js', () => ({
  credentialsManager: {
    getActiveWorkspace: () => activeWorkspace.slug,
    getUserToken: () => undefined,
    getSiteToken: () => undefined,
    getApiUrl: () => undefined,
  },
}))

function buildProgram(): Command {
  const program = new Command('marvin')
    .exitOverride()
    .option('--api-url <url>', 'API URL')
    .option('--workspace <slug>', 'Workspace slug')
    .option('--output <format>', 'Output format', 'table')
    .option('--json', 'JSON output', false)
    .option('--yaml', 'YAML output', false)
    .option('--csv', 'CSV output', false)
  trackCommandContext(program)
  registerWorkspaceCommands(program, { hidden: false })
  program.addCommand(createPlatformCommand())
  program.addCommand(createAdminCommand())
  return program
}

function allCommandPaths(cmd: Command, out: string[] = []): string[] {
  for (const sub of cmd.commands) {
    out.push(commandPath(sub))
    allCommandPaths(sub, out)
  }
  return out
}

const forbidden = () => new MarvinAuthError('Authentication failed: Forbidden', 403)

describe('requiredRoleFor', () => {
  it.each([
    ['platform entry-types create', 'ADMIN'],
    ['platform forms delete', 'ADMIN'],
    ['platform webhooks list', 'ADMIN'],
    ['platform variables create', 'ADMIN'],
    ['platform scheduled-tasks run', 'ADMIN'],
    ['platform invites list', 'ADMIN'],
    ['workspace export', 'ADMIN'],
    ['workspace backups list', 'ADMIN'],
    ['platform collections create', 'EDITOR'],
    ['platform resources update', 'EDITOR'],
    ['platform assets update', 'EDITOR'],
    ['platform entries create', 'AUTHOR'],
    ['admin users list', 'SUPER_ADMIN'],
  ])('%s needs %s', (path, role) => {
    expect(requiredRoleFor(path)).toBe(role)
  })

  it.each([
    'platform entry-types list',
    'platform webhooks types',
    'platform scheduled-tasks types',
    'platform collections list',
    'platform entries list',
    'workspace use',
  ])('%s has no role gate in the table', path => {
    expect(requiredRoleFor(path)).toBeUndefined()
  })

  it('every entry names a real command', () => {
    const paths = new Set(allCommandPaths(buildProgram()))
    const unknown = Object.keys(REQUIRED_ROLES).filter(key => !paths.has(key))
    expect(unknown).toEqual([])
  })
})

describe('annotateRequiredRoles', () => {
  function find(root: Command, path: string): Command {
    let cmd = root
    for (const name of path.split(' ')) cmd = cmd.commands.find(c => c.name() === name)!
    return cmd
  }

  it('adds the role to the help text of gated commands only', () => {
    const program = buildProgram()
    annotateRequiredRoles(program)
    expect(find(program, 'platform entry-types create').description()).toMatch(/\(needs workspace ADMIN\)$/)
    expect(find(program, 'platform collections update').description()).toMatch(/\(needs workspace EDITOR\)$/)
    expect(find(program, 'platform webhooks').description()).toMatch(/\(needs workspace ADMIN\)$/)
    expect(find(program, 'workspace backups').description()).toMatch(/\(needs workspace ADMIN\)$/)
    expect(find(program, 'platform entry-types list').description()).not.toMatch(/needs/)
    expect(find(program, 'platform webhooks types').description()).not.toMatch(/needs/)
  })

  it('leaves a description that already states its requirement alone', () => {
    const program = buildProgram()
    annotateRequiredRoles(program)
    expect(find(program, 'admin users').description()).toBe('User management (requires SUPER_ADMIN)')
  })
})

describe('describePermissionDenied', () => {
  it('names the role and the workspace', () => {
    expect(describePermissionDenied('platform entry-types create', 'acme').message)
      .toBe("This needs the ADMIN role in workspace 'acme'.")
  })

  it('falls back to the active workspace when none is known', () => {
    expect(describePermissionDenied('platform collections delete', undefined).message)
      .toBe('This needs the EDITOR role in the active workspace.')
  })

  it('says SUPER_ADMIN is a platform role, without a workspace', () => {
    const denied = describePermissionDenied('admin groups list', 'acme')
    expect(denied.message).toBe('This needs the SUPER_ADMIN platform role.')
    expect(denied.workspace).toBeUndefined()
  })

  it('explains the AUTHOR rule for entries', () => {
    expect(describePermissionDenied('platform entries update', 'acme').message).toMatch(
      /AUTHOR role in workspace 'acme' for your own draft entries, or EDITOR/
    )
  })

  it('still says it is a role problem for a command the table does not cover', () => {
    expect(describePermissionDenied('platform tags list', 'acme').message)
      .toBe("Your role in workspace 'acme' doesn't allow this.")
  })
})

describe('a 403 from a command', () => {
  let io: Captured
  let stdout: string[]
  let stderr: string[]
  const argv = process.argv

  beforeEach(() => {
    activeWorkspace.slug = undefined
    delete process.env.MARVIN_WORKSPACE_SLUG
    resetCommandContext()
    io = captureOutput()
    stdout = io.stdout
    stderr = io.stderr
  })

  afterEach(() => {
    vi.restoreAllMocks()
    process.argv = argv
    process.exitCode = 0
  })

  // The error handler takes the output mode from the parsed command, or process.argv before one ran.
  async function run(...args: string[]): Promise<void> {
    process.argv = ['node', 'marvin', ...args]
    await buildProgram().parseAsync(process.argv)
  }

  it('says which role and workspace an ADMIN-only command needs', async () => {
    vi.mocked(clientFactory.createPlatformClient).mockResolvedValue({
      // `webhooks list` pages through the API itself (client.get), not the SDK's page-1 helper
      get: vi.fn().mockRejectedValue(forbidden()),
    } as any)

    await run('platform', 'webhooks', 'list', '--workspace', 'acme')

    const text = stderr.join('\n')
    expect(text).toContain('Permission denied (403)')
    expect(text).toContain("This needs the ADMIN role in workspace 'acme'.")
    expect(text).toContain('workspace-members update-role')
    expect(text).not.toContain('Authentication Error')
    expect(text).not.toContain('marvin login')
    expect(process.exitCode).toBe(1)
  })

  it('uses the active workspace when --workspace is not given', async () => {
    activeWorkspace.slug = 'saved-ws'
    const dir = mkdtempSync(join(tmpdir(), 'marvin-cli-'))
    const file = join(dir, 'et.json')
    writeFileSync(file, '{"name":"T","slug":"t","schemaJson":{"fields":[]}}')
    vi.mocked(clientFactory.createPlatformClient).mockResolvedValue({
      entryTypes: { create: vi.fn().mockRejectedValue(forbidden()) },
    } as any)

    await run('platform', 'entry-types', 'create', '--file', file)

    expect(stderr.join('\n')).toContain("This needs the ADMIN role in workspace 'saved-ws'.")
  })

  it('reports role and workspace as JSON fields with --json', async () => {
    vi.mocked(clientFactory.createPlatformClient).mockResolvedValue({
      collections: { delete: vi.fn().mockRejectedValue(forbidden()) },
    } as any)

    await run('platform', 'collections', 'delete', 'c1', '--yes', '--workspace', 'acme', '--json')

    expect(JSON.parse(stdout.at(-1)!)).toEqual({
      error: "This needs the EDITOR role in workspace 'acme'.",
      status: 403,
      requiredRole: 'EDITOR',
      workspace: 'acme',
    })
    expect(process.exitCode).toBe(1)
  })

  it("shows the server's reason when the error carries one", () => {
    process.argv = ['node', 'marvin']
    handleCommandError(
      new MarvinApiError('Forbidden', 403, '/api/groups/webhooks', '{"detail":"ADMIN or OWNER role required."}')
    )
    expect(stderr.join('\n')).toContain('ADMIN or OWNER role required.')
  })

  it('still treats a 401 as a sign-in problem', () => {
    process.argv = ['node', 'marvin']
    handleCommandError(new MarvinAuthError('Authentication failed: Unauthorized', 401))
    const text = stderr.join('\n')
    expect(text).toContain('Authentication Error')
    expect(text).not.toContain('Permission denied')
  })
})
