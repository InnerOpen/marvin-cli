/**
 * Regression tests against a mocked SDK: `user tokens create`, `user profile update`,
 * `platform workspace-members add|update-role`, `collections --limit/--offset` (forwarded to the SDK), email-template
 * body flags, and MARVIN_OUTPUT_FORMAT as the default output format.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { Command } from 'commander'
import { createPlatformCommand } from '../commands/platform/index.js'
import { createPublishCommand } from '../commands/publish/index.js'
import { createUserCommand } from '../commands/user/index.js'
import { clientFactory } from '../shared/clients.js'
import { resetCommandContext, trackCommandContext, getCommandContext } from '../shared/command-context.js'
import { getOutputMode } from '../shared/types.js'
import { captureOutput, type Captured } from './helpers/capture.js'

vi.mock('../shared/clients.js', () => ({
  clientFactory: { createPlatformClient: vi.fn(), createPublishClient: vi.fn() },
  ClientFactory: class {},
}))

/** Mirrors src/index.ts: --output has no commander default so MARVIN_OUTPUT_FORMAT can apply. */
function buildProgram(): Command {
  const program = new Command('marvin')
    .exitOverride()
    .option('--output <format>', 'Output format')
    .option('--json', 'JSON output', false)
    .option('--yaml', 'YAML output', false)
    .option('--csv', 'CSV output', false)
  trackCommandContext(program)
  program.addCommand(createPlatformCommand())
  program.addCommand(createPublishCommand())
  program.addCommand(createUserCommand())
  return program
}

async function run(...args: string[]): Promise<void> {
  await buildProgram().parseAsync(['node', 'marvin', ...args])
}

describe('CLI bug fixes', () => {
  let io: Captured

  beforeEach(() => {
    resetCommandContext()
    io = captureOutput()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllEnvs()
    process.exitCode = 0
  })

  describe('user tokens create', () => {
    let user: any
    beforeEach(() => {
      user = { createApiToken: vi.fn().mockResolvedValue({ id: 't1', name: 'ci', token: 'secret' }) }
      vi.mocked(clientFactory.createPlatformClient).mockResolvedValue({ user } as any)
    })

    it('sends name and description, with the API default integrationId (the API has no expiry field)', async () => {
      await run('user', 'tokens', 'create', '--name', 'ci', '--description', 'nightly', '--json')
      expect(user.createApiToken).toHaveBeenCalledWith({ name: 'ci', description: 'nightly', integrationId: 'generic' })
    })

    it('rejects --expires instead of silently dropping it', async () => {
      // subcommands don't inherit exitOverride, so commander calls process.exit (trapped by vitest)
      await expect(run('user', 'tokens', 'create', '--name', 'ci', '--expires', '2027-01-01')).rejects.toThrow(/process\.exit/)
      expect(io.err()).toContain("unknown option '--expires'")
      expect(user.createApiToken).not.toHaveBeenCalled()
    })
  })

  describe('user profile update', () => {
    let user: any
    beforeEach(() => {
      user = { updateProfile: vi.fn().mockResolvedValue(undefined) }
      vi.mocked(clientFactory.createPlatformClient).mockResolvedValue({ user } as any)
    })

    it('sends fullName, username and email', async () => {
      await run('user', 'profile', 'update', '--full-name', 'Sam Rivera', '--username', 'sam', '--email', 'sam@example.com', '--json')
      expect(user.updateProfile).toHaveBeenCalledWith({ fullName: 'Sam Rivera', username: 'sam', email: 'sam@example.com' })
    })

    it('--name still works and maps to fullName', async () => {
      await run('user', 'profile', 'update', '--name', 'Sam Rivera', '--json')
      expect(user.updateProfile).toHaveBeenCalledWith({ fullName: 'Sam Rivera' })
    })

    it('needs at least one field', async () => {
      await run('user', 'profile', 'update')
      expect(process.exitCode).toBe(1)
      expect(user.updateProfile).not.toHaveBeenCalled()
    })
  })

  describe('platform workspace-members', () => {
    let workspaceMembers: any
    beforeEach(() => {
      workspaceMembers = {
        add: vi.fn().mockResolvedValue({ id: 'm1', workspaceRole: 'EDITOR' }),
        updateRole: vi.fn().mockResolvedValue({ id: 'm1', workspaceRole: 'AUTHOR' }),
      }
      vi.mocked(clientFactory.createPlatformClient).mockResolvedValue({ workspaceMembers } as any)
    })

    it.each(['OWNER', 'ADMIN', 'EDITOR', 'AUTHOR', 'VIEWER'])('add accepts the %s role (camelCase body)', async (role) => {
      await run('platform', 'workspace-members', 'add', 'w1', '--user-id', 'u1', '--role', role.toLowerCase(), '--json')
      expect(workspaceMembers.add).toHaveBeenCalledWith('w1', { userId: 'u1', workspaceRole: role })
    })

    it('add rejects MEMBER (not a backend role) before sending', async () => {
      await run('platform', 'workspace-members', 'add', 'w1', '--user-id', 'u1', '--role', 'MEMBER')
      expect(process.exitCode).toBe(1)
      expect(io.err()).toContain('OWNER, ADMIN, EDITOR, AUTHOR, VIEWER')
      expect(workspaceMembers.add).not.toHaveBeenCalled()
    })

    it('add normalises a legacy snake_case --data body to camelCase', async () => {
      await run('platform', 'workspace-members', 'add', 'w1', '--data', '{"user_id":"u1","workspace_role":"author"}', '--json')
      expect(workspaceMembers.add).toHaveBeenCalledWith('w1', { userId: 'u1', workspaceRole: 'AUTHOR' })
    })

    it('update-role sends workspaceRole and validates it', async () => {
      await run('platform', 'workspace-members', 'update-role', 'w1', 'u1', '--role', 'author', '--json')
      expect(workspaceMembers.updateRole).toHaveBeenCalledWith('w1', 'u1', { workspaceRole: 'AUTHOR' })

      workspaceMembers.updateRole.mockClear()
      await run('platform', 'workspace-members', 'update-role', 'w1', 'u1', '--role', 'member')
      expect(process.exitCode).toBe(1)
      expect(workspaceMembers.updateRole).not.toHaveBeenCalled()
    })
  })

  describe('email-templates body flags', () => {
    let emailTemplates: any
    beforeEach(() => {
      emailTemplates = {
        create: vi.fn().mockImplementation((_w, body) => Promise.resolve({ id: 'e1', name: body.name })),
        update: vi.fn().mockImplementation((_w, id, body) => Promise.resolve({ id, name: 'n', ...body })),
      }
      vi.mocked(clientFactory.createPlatformClient).mockResolvedValue({
        workspaces: { getCurrent: vi.fn().mockResolvedValue({ id: 'w1' }) },
        emailTemplates,
      } as any)
    })

    it('create sends bodyMarkdown, never the removed structured fields', async () => {
      await run('platform', 'email-templates', 'create', '--type', 'custom', '--name', 'Hi', '--subject', 'S', '--body', '# Hello', '--json')
      const body = emailTemplates.create.mock.calls[0][1]
      expect(body.bodyMarkdown).toBe('# Hello')
      for (const key of ['headerText', 'messageTop', 'messageBottom', 'buttonText']) expect(body).not.toHaveProperty(key)
    })

    it('update sends bodyMarkdown; the old structured flags are gone', async () => {
      await run('platform', 'email-templates', 'update', 'e1', '--body', 'Text', '--json')
      expect(emailTemplates.update).toHaveBeenCalledWith('w1', 'e1', { bodyMarkdown: 'Text' })
      await expect(run('platform', 'email-templates', 'update', 'e1', '--message-top', 'x')).rejects.toThrow(/process\.exit/)
      expect(io.err()).toContain("unknown option '--message-top'")
    })
  })

  describe('collections --limit/--offset', () => {
    let list: any
    const rows = [{ slug: 'a', title: 'A' }, { slug: 'b', title: 'B' }]
    beforeEach(() => {
      list = vi.fn().mockResolvedValue(rows)
      vi.mocked(clientFactory.createPublishClient).mockReturnValue({ collections: { list } } as any)
    })

    it('without options asks for the server default page and prints what comes back', async () => {
      await run('publish', 'collections', '--json')
      expect(list).toHaveBeenCalledWith({ limit: undefined, offset: undefined })
      expect((JSON.parse(io.out()) as any[]).map((r) => r.slug)).toEqual(['a', 'b'])
    })

    it('forwards --limit and --offset to the SDK and does not slice the result', async () => {
      await run('publish', 'collections', '--offset', '40', '--limit', '30', '--json')
      expect(list).toHaveBeenCalledWith({ limit: 30, offset: 40 })
      expect((JSON.parse(io.out()) as any[]).map((r) => r.slug)).toEqual(['a', 'b'])
    })

    it('forwards --offset 0', async () => {
      await run('publish', 'collections', '--offset', '0', '--json')
      expect(list).toHaveBeenCalledWith({ limit: undefined, offset: 0 })
    })

    it('rejects a non-numeric --limit', async () => {
      await run('publish', 'collections', '--limit', 'lots')
      expect(process.exitCode).toBe(1)
      expect(io.err()).toContain('--limit must be a number')
      expect(list).not.toHaveBeenCalled()
    })

    it('rejects a --limit above the server maximum', async () => {
      await run('publish', 'collections', '--limit', '101')
      expect(process.exitCode).toBe(1)
      expect(io.err()).toContain('--limit can be at most 100')
      expect(list).not.toHaveBeenCalled()
    })

    it('rejects a negative --offset', async () => {
      await run('publish', 'collections', '--offset', '-1')
      expect(process.exitCode).toBe(1)
      expect(list).not.toHaveBeenCalled()
    })
  })

  describe('MARVIN_OUTPUT_FORMAT', () => {
    it('is the default format', () => {
      vi.stubEnv('MARVIN_OUTPUT_FORMAT', 'json')
      expect(getOutputMode({})).toBe('json')
      vi.stubEnv('MARVIN_OUTPUT_FORMAT', 'YAML')
      expect(getOutputMode({})).toBe('yaml')
    })

    it('falls back to table when unset or blank', () => {
      vi.stubEnv('MARVIN_OUTPUT_FORMAT', '')
      expect(getOutputMode({})).toBe('table')
    })

    it('--output and the --json/--yaml/--csv shortcuts win over it', () => {
      vi.stubEnv('MARVIN_OUTPUT_FORMAT', 'json')
      expect(getOutputMode({ output: 'csv' })).toBe('csv')
      expect(getOutputMode({ yaml: true })).toBe('yaml')
      expect(getOutputMode({ csv: true })).toBe('csv')
    })

    it('rejects an unsupported value', () => {
      vi.stubEnv('MARVIN_OUTPUT_FORMAT', 'xml')
      expect(() => getOutputMode({})).toThrow(/Unsupported output format: xml/)
    })

    it('applies end to end, and the flag still wins', async () => {
      vi.mocked(clientFactory.createPublishClient).mockReturnValue({
        collections: { list: vi.fn().mockResolvedValue([{ slug: 'a', title: 'A' }]) },
      } as any)
      vi.stubEnv('MARVIN_OUTPUT_FORMAT', 'json')
      await run('publish', 'collections')
      expect(JSON.parse(io.out())).toEqual([{ slug: 'a', title: 'A' }])

      io.clear()
      await run('publish', 'collections', '--output', 'yaml')
      expect(io.out()).toContain('slug: a')
    })

    it('the command context (used for error messages) sees it too', async () => {
      vi.stubEnv('MARVIN_OUTPUT_FORMAT', 'json')
      vi.mocked(clientFactory.createPublishClient).mockReturnValue({ collections: { list: vi.fn().mockResolvedValue([]) } } as any)
      await run('publish', 'collections')
      expect(getCommandContext()?.outputMode).toBe('json')
    })
  })
})
