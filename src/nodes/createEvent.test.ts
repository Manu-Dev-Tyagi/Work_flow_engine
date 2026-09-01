import { describe, expect, it, vi, afterEach } from 'vitest'
import { plutoPaths } from '../integrations/vesta/config'
import { createEventDefinition } from './createEvent'

describe('createEvent execute', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('posts templateId, eventContainerId, and columnValues to Pluto create', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: 'event-uuid-1' }),
    })
    vi.stubGlobal('fetch', fetchMock)

    const result = await createEventDefinition.execute({
      configuration: {},
      input: {
        templateId: 'template-1',
        eventContainerId: 'container-1',
        columnValues: { 'col-a': 'Alice' },
        disposition: 'disp-1',
      },
    })

    expect(result.eventId).toBe('event-uuid-1')
    expect(fetchMock).toHaveBeenCalledOnce()
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe(`/api/vesta${plutoPaths.eventsCreate}`)
    expect(JSON.parse(String(init.body))).toEqual({
      templateId: 'template-1',
      data: {
        event_container_id: 'container-1',
        additionalColumnValues: { 'col-a': 'Alice' },
        disposition: 'disp-1',
      },
    })
  })

  it('re-augments column values from found container before create', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: 'event-uuid-2' }),
    })
    vi.stubGlobal('fetch', fetchMock)

    const eventTemplate = {
      id: 'event-tpl',
      displayName: 'Enquiry',
      additionalColumns: [
        {
          id: 'event-phone',
          displayName: 'Contact Number',
          type: '576252a9-acc7-4379-b113-15adbffd3e69',
        },
      ],
    }
    const containerTemplate = {
      id: 'container-tpl',
      displayName: 'Journeys',
      additionalColumns: [
        {
          id: 'container-phone',
          displayName: 'Contact Number',
          type: '576252a9-acc7-4379-b113-15adbffd3e69',
        },
      ],
    }

    await createEventDefinition.execute({
      configuration: {},
      input: {
        templateId: 'template-1',
        eventContainerId: 'container-1',
        columnValues: {},
        eventTemplate,
        containerTemplate,
        container: {
          additionalColumnValues: { 'container-phone': '+91999' },
        },
      },
    })

    const body = JSON.parse(String(fetchMock.mock.calls[0][1].body))
    expect(body.data.additionalColumnValues).toEqual({ 'event-phone': '+91999' })
  })

  it('applies repeat-lead overrides when an existing container is wired', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: 'event-uuid-3' }),
    })
    vi.stubGlobal('fetch', fetchMock)

    const eventTemplate = {
      id: 'event-tpl',
      displayName: 'Enquiry',
      additionalColumns: [
        {
          id: 'event-status',
          displayName: 'Enquiry Status',
          type: 'e010f1f3-3ae3-4e48-96e8-3dfba6b217c9',
        },
      ],
    }

    await createEventDefinition.execute({
      configuration: {
        existingContainerFieldOverrides: {
          enquiryStatus: 'duplicate-status-id',
        },
      },
      input: {
        templateId: 'template-1',
        eventContainerId: 'container-1',
        columnValues: { 'event-status': 'open-status-id' },
        eventTemplate,
        container: { id: 'container-1', additionalColumnValues: {} },
      },
    })

    const body = JSON.parse(String(fetchMock.mock.calls[0][1].body))
    expect(body.data.additionalColumnValues).toEqual({ 'event-status': 'duplicate-status-id' })
  })
})
