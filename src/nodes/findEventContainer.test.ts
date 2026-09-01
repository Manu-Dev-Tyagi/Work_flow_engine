import { describe, expect, it, vi, afterEach } from 'vitest'
import { plutoPaths } from '../integrations/vesta/config'
import { PhysicalColumnSourceType } from '../integrations/vesta/types'
import { findEventContainerDefinition } from './findEventContainer'

describe('findEventContainer execute', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('uses matchColumnId from node configuration', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: [
          {
            id: 'container-1',
            templateId: 'template-1',
            additionalColumnValues: { 'col-phone': '+911234567890' },
          },
        ],
      }),
    })
    vi.stubGlobal('fetch', fetchMock)

    const result = await findEventContainerDefinition.execute({
      configuration: { matchColumnId: 'col-phone', matchColumnDisplayName: 'Contact Number' },
      input: {
        templateId: 'template-1',
        matchValue: '+911234567890',
      },
    })

    expect(result.eventContainerId).toBe('container-1')
    const getAllCall = fetchMock.mock.calls.find(([url]) =>
      String(url).includes(plutoPaths.eventContainersGetAll),
    )
    const body = JSON.parse(String((getAllCall as [string, RequestInit])[1].body))
    expect(body.filters.filters[0].column).toBe('col-phone')
  })

  it('prefers wired matchColumnId over configuration', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: [],
      }),
    })
    vi.stubGlobal('fetch', fetchMock)

    await findEventContainerDefinition.execute({
      configuration: { matchColumnId: 'col-phone', matchColumnDisplayName: 'Contact Number' },
      input: {
        templateId: 'template-1',
        matchValue: '+911',
        matchColumnId: 'wired-col',
      },
    })

    const getAllCall = fetchMock.mock.calls.find(([url]) =>
      String(url).includes(plutoPaths.eventContainersGetAll),
    )
    const body = JSON.parse(String((getAllCall as [string, RequestInit])[1].body))
    expect(body.filters.filters[0].column).toBe('wired-col')
  })

  it('returns empty outputs when no container matches', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: [] }),
      }),
    )

    const result = await findEventContainerDefinition.execute({
      configuration: { matchColumnId: 'col-phone', matchColumnDisplayName: 'Contact Number' },
      input: {
        templateId: 'template-1',
        matchValue: '+910000000000',
      },
    })

    expect(result).toEqual({ eventContainerId: '', container: {} })
  })
})
