import { describe, expect, it, vi } from 'vitest'

describe('warn', () => {
  it('prints each distinct complaint once, however often it is handed the same one', async () => {
    // A fresh module, so the "already said that" memory starts empty.
    vi.resetModules()
    const { warn } = await import('../../src/diagnostics')
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    warn([{ code: 'no-axis' }])
    warn([{ code: 'no-axis' }])
    warn([{ code: 'duplicate-stop-value', index: 2 }])
    warn([])

    expect(spy).toHaveBeenCalledTimes(2)
    expect(spy.mock.calls[0]?.[0]).toContain('no-axis')
    expect(spy.mock.calls[1]?.[0]).toContain('duplicate-stop-value')

    spy.mockRestore()
  })
})
