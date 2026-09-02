import { describe, expect, it } from 'vitest'
import {
  augmentColumnValuesFromContainer,
  buildColumnValuesFromInput,
  getMissingRequiredColumnValues,
  getPhysicalColumns,
  normalizeAdditionalColumns,
  normalizeContainerTemplate,
  readContainerId,
} from '../../integrations/vesta/columns'
import { PhysicalColumnSourceType, ResolverColumnSourceType } from '../../integrations/vesta/types'
import { fetchEventContainerTemplates } from '../../integrations/vesta/eventContainerTemplatesApi'
import { vi, afterEach } from 'vitest'

describe('normalizeContainerTemplate', () => {
  it('reads additionalColumns from alternate API field names', () => {
    const template = normalizeContainerTemplate({
      id: 'tpl-1',
      displayName: 'Leads',
      columns: [
        {
          id: 'col-phone',
          displayName: 'Contact Number',
          type: '576252a9-acc7-4379-b113-15adbffd3e69',
        },
      ],
    })
    expect(template?.additionalColumns).toHaveLength(1)
    expect(getPhysicalColumns(template)).toHaveLength(1)
  })
})

describe('getPhysicalColumns', () => {
  it('excludes only resolver columns', () => {
    const columns = normalizeAdditionalColumns([
      {
        id: 'col-phone',
        displayName: 'Contact Number',
        type: '576252a9-acc7-4379-b113-15adbffd3e69',
        source: PhysicalColumnSourceType,
      },
      {
        id: 'col-resolver',
        displayName: 'Computed',
        type: '5b3314a7-31a6-4cc1-8642-6a4cfb2f03a1',
        source: { type: ResolverColumnSourceType, sql: 'SELECT 1' },
      },
      {
        id: 'col-unknown',
        displayName: 'Custom',
        type: '5b3314a7-31a6-4cc1-8642-6a4cfb2f03a1',
        source: { type: 'some-other-uuid', required: false, unique: false },
      },
    ])
    expect(getPhysicalColumns({ additionalColumns: columns })).toHaveLength(2)
  })
})

describe('buildColumnValuesFromInput', () => {
  it('maps fields object keys to column ids by port name', () => {
    const template = normalizeContainerTemplate({
      id: 'tpl-1',
      displayName: 'Journeys',
      additionalColumns: [
        {
          id: 'col-phone',
          displayName: 'Contact Number',
          type: '576252a9-acc7-4379-b113-15adbffd3e69',
        },
        {
          id: 'col-name',
          displayName: 'Customer Name',
          type: '5b3314a7-31a6-4cc1-8642-6a4cfb2f03a1',
        },
      ],
    })

    const columnValues = buildColumnValuesFromInput(template, {
      fields: {
        contactNumber: '+91111',
        customerName: 'Testing Workflow Engine',
      },
    })

    expect(columnValues).toEqual({
      'col-phone': '+91111',
      'col-name': 'Testing Workflow Engine',
    })
  })
})

describe('augmentColumnValuesFromContainer', () => {
  it('copies values from container columns with matching display names', () => {
    const containerTemplate = normalizeContainerTemplate({
      id: 'container-tpl',
      displayName: 'Journeys',
      additionalColumns: [
        {
          id: 'container-phone',
          displayName: 'Contact Number',
          type: '576252a9-acc7-4379-b113-15adbffd3e69',
        },
      ],
    })
    const eventTemplate = normalizeContainerTemplate({
      id: 'event-tpl',
      displayName: 'Enquiry',
      additionalColumns: [
        {
          id: 'event-phone',
          displayName: 'Contact Number',
          type: '576252a9-acc7-4379-b113-15adbffd3e69',
        },
        {
          id: 'event-status',
          displayName: 'Enquiry Status',
          type: 'e010f1f3-3ae3-4e48-96e8-3dfba6b217c9',
        },
      ],
    })

    const columnValues = augmentColumnValuesFromContainer(
      eventTemplate,
      containerTemplate,
      { 'container-phone': '+91111' },
      { 'event-status': 'open-status-id' },
    )

    expect(columnValues).toEqual({
      'event-status': 'open-status-id',
      'event-phone': '+91111',
    })
  })
})

describe('readContainerId', () => {
  it('returns id when container object has one', () => {
    expect(readContainerId({ id: 'container-1' })).toBe('container-1')
    expect(readContainerId({})).toBeNull()
  })
})

describe('getMissingRequiredColumnValues', () => {
  it('returns display names for required columns without values', () => {
    const template = {
      additionalColumns: [
        {
          id: 'col-required',
          displayName: 'Enquiry Status',
          type: 'e010f1f3-3ae3-4e48-96e8-3dfba6b217c9',
          source: { type: PhysicalColumnSourceType, required: true, unique: false },
        },
        {
          id: 'col-optional',
          displayName: 'Customer VOC',
          type: '5b3314a7-31a6-4cc1-8642-6a4cfb2f03a1',
          source: { type: PhysicalColumnSourceType, required: false, unique: false },
        },
      ],
    }
    expect(getMissingRequiredColumnValues(template, {})).toEqual(['Enquiry Status'])
    expect(getMissingRequiredColumnValues(template, { 'col-required': 'open-id' })).toEqual([])
  })
})

describe('fetchEventContainerTemplates', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('normalizes templates from API payload', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: [
            {
              id: 'tpl-1',
              displayName: 'Leads',
              additionalColumns: [
                {
                  id: 'col-phone',
                  displayName: 'Contact Number',
                  type: '576252a9-acc7-4379-b113-15adbffd3e69',
                  source: '87d5c3f4-7b66-484f-8053-d1213f6b9093',
                },
              ],
            },
          ],
        }),
      }),
    )

    const templates = await fetchEventContainerTemplates()
    expect(templates).toHaveLength(1)
    expect(getPhysicalColumns(templates[0])).toHaveLength(1)
  })
})
