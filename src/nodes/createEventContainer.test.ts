import { describe, expect, it, vi, afterEach } from 'vitest'
import { plutoPaths } from '../integrations/vesta/config'
import { createEventContainerDefinition } from './createEventContainer'

describe('createEventContainer execute', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('posts templateId and columnValues to Pluto create', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: 'container-uuid-1' }),
    })
    vi.stubGlobal('fetch', fetchMock)

    const result = await createEventContainerDefinition.execute({
      configuration: { organizationalUnitId: '', organizationalUnitDisplayName: '' },
      input: {
        templateId: 'template-1',
        columnValues: { 'col-phone': '+911234567890' },
        disposition: 'disp-1',
        organizationalUnitId: 'ou-1',
      },
    })

    expect(result.eventContainerId).toBe('container-uuid-1')
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe(`/api/vesta${plutoPaths.eventContainersCreate}`)
    expect(JSON.parse(String(init.body))).toEqual({
      templateId: 'template-1',
      data: {
        additionalColumnValues: { 'col-phone': '+911234567890' },
        disposition: 'disp-1',
        ou_id: 'ou-1',
      },
    })
  })

  it('uses organizationalUnitId from node configuration', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: 'container-uuid-1' }),
    })
    vi.stubGlobal('fetch', fetchMock)

    await createEventContainerDefinition.execute({
      configuration: { organizationalUnitId: 'ou-from-config', organizationalUnitDisplayName: 'North' },
      input: {
        templateId: 'template-1',
        columnValues: { 'col-phone': '+911' },
      },
    })

    const body = JSON.parse(String((fetchMock.mock.calls[0] as [string, RequestInit])[1].body))
    expect(body.data.ou_id).toBe('ou-from-config')
  })

  it('throws when organizationalUnitId is missing', async () => {
    await expect(
      createEventContainerDefinition.execute({
        configuration: { organizationalUnitId: '', organizationalUnitDisplayName: '' },
        input: {
          templateId: 'template-1',
          columnValues: { 'col-phone': '+911' },
        },
      }),
    ).rejects.toThrow('organizationalUnitId is required')
  })
})
