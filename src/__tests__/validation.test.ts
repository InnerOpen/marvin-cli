/**
 * Unit tests for the shared input-validation helpers — the security-relevant guards
 * (JSON-object shape, email, SSRF-flavoured API-URL, and file-path checks).
 */

import { describe, it, expect } from 'vitest'
import {
  validateJsonObject,
  validateEmail,
  requireValidEmail,
  validateApiUrl,
  validateFilePath,
} from '../shared/validation.js'

describe('validateJsonObject', () => {
  it('accepts a plain object', () => {
    expect(() => validateJsonObject({ a: 1 })).not.toThrow()
  })

  it('rejects arrays, null, and primitives, naming the actual type', () => {
    expect(() => validateJsonObject([1], 'body')).toThrow(/Invalid body: expected a JSON object, got array/)
    expect(() => validateJsonObject(null)).toThrow(/got null/)
    expect(() => validateJsonObject('x')).toThrow(/got string/)
    expect(() => validateJsonObject(42)).toThrow(/got number/)
  })
})

describe('validateEmail / requireValidEmail', () => {
  it('accepts well-formed addresses', () => {
    expect(validateEmail('user@example.com')).toBe(true)
    expect(validateEmail('a.b+c@sub.domain.io')).toBe(true)
  })

  it('rejects malformed addresses', () => {
    for (const bad of ['plain', 'no@domain', 'a@b', 'spaces in@x.com', '@x.com', 'a@ .com']) {
      expect(validateEmail(bad)).toBe(false)
    }
  })

  it('requireValidEmail throws on missing or invalid input, passes on valid', () => {
    expect(() => requireValidEmail('')).toThrow(/required/)
    // @ts-expect-error — exercising the runtime guard against a non-string
    expect(() => requireValidEmail(undefined)).toThrow(/required/)
    expect(() => requireValidEmail('nope')).toThrow(/Invalid email format/)
    expect(() => requireValidEmail('user@example.com')).not.toThrow()
  })
})

describe('validateApiUrl', () => {
  it('requires a string URL', () => {
    expect(() => validateApiUrl('')).toThrow(/required/)
  })

  it('rejects unparseable URLs and non-http(s) protocols', () => {
    expect(() => validateApiUrl('not a url')).toThrow(/Invalid API URL/)
    expect(() => validateApiUrl('ftp://example.com')).toThrow(/protocol/)
  })

  it('accepts http/https; private IPs and localhost warn but do not throw', () => {
    expect(() => validateApiUrl('https://api.example.com')).not.toThrow()
    expect(() => validateApiUrl('http://localhost:8080')).not.toThrow()
    expect(() => validateApiUrl('http://10.0.0.1')).not.toThrow()
  })
})

describe('validateFilePath', () => {
  it('rejects absolute paths when allowAbsolute is false', () => {
    expect(() => validateFilePath('/etc/passwd', { allowAbsolute: false, mustExist: false })).toThrow(
      /Absolute paths are not allowed/
    )
  })

  it('throws when a required file does not exist', () => {
    expect(() => validateFilePath('definitely/missing/file.json', { mustExist: true })).toThrow(/File not found/)
  })
})
