import { describe, expect, it, vi, afterEach } from 'vitest'
import { NodeType, PortType } from '../engine/graph/enums'
import { resolveNodePorts } from '../engine/registry/resolvePorts'
import { getEventTemplateDefinition } from '../nodes/getEventTemplate'
import { toPortName, getPhysicalColumns, columnPortType, resolveColumnIdByDisplayName, normalizeAdditionalColumns } from '../integrations/vesta/columns'
import { unwrapVestaResponse } from '../integrations/vesta/unwrapResponse'
import { PhysicalColumnSourceType, ResolverColumnSourceType } from '../integrations/vesta/types'
import type { OttopilotEventTemplate } from '../integrations/vesta/types'

const mockTemplate: OttopilotEventTemplate = {
  id: 'template-1',
  displayName: 'Blue store Enquiries',
  description: null,
  eventContainerTemplateId: 'container-template-1',
  revisionId: 'rev-1',
  status: 'active',
  additionalColumns: [
    {
      id: 'col-customer-name',
      displayName: 'Customer Name',
      type: '5b3314a7-31a6-4cc1-8642-6a4cfb2f03a1',
      source: { type: PhysicalColumnSourceType, required: true, unique: false },
    },
    {
      id: 'col-resolver',
      displayName: 'Computed',
      type: '5b3314a7-31a6-4cc1-8642-6a4cfb2f03a1',
      source: { type: ResolverColumnSourceType, sql: 'SELECT 1' },
    },
    {
      id: 'col-lat',
      displayName: 'Latitude',
      type: 'd41cfed6-8c18-47d1-b833-34d3aabf784b',
      source: { type: PhysicalColumnSourceType, required: false, unique: false },
    },
  ],
  configuration: {
    defaultDisposition: 'disp-1',
    dispositions: [{ id: 'disp-1', displayName: 'Open' }],
  },
}

describe('unwrapVestaResponse', () => {
  it('unwraps success envelope', () => {
    expect(unwrapVestaResponse({ success: true, data: [{ id: '1' }] })).toEqual([{ id: '1' }])
  })

  it('throws on failure envelope', () => {
    expect(() =>
      unwrapVestaResponse({ success: false, error: { message: 'Unauthorized' } }),
    ).toThrow('Unauthorized')
  })

  it('throws helpful message for opaque Pluto wrapper UUID', () => {
    expect(() =>
      unwrapVestaResponse({
        success: false,
        error: 'bf022779-c79c-475a-803d-d35b0380431d',
      }),
    ).toThrow(/opaque error bf022779/)
  })

  it('unwraps nested database error instead of opaque UUID wrapper', () => {
    expect(() =>
      unwrapVestaResponse({
        success: false,
        error: {
          message: 'bf022779-c79c-475a-803d-d35b0380431d',
          cause: 'null value in column "enquiry-status" violates not-null constraint',
        },
      }),
    ).toThrow('null value in column "enquiry-status" violates not-null constraint')
  })
})

describe('vesta columns', () => {
  it('resolveColumnIdByDisplayName matches display name', () => {
    expect(resolveColumnIdByDisplayName(mockTemplate, 'Customer Name')).toBe('col-customer-name')
  })

  it('toPortName converts display names to camelCase', () => {
    expect(toPortName('Customer Name')).toBe('customerName')
  })

  it('getPhysicalColumns filters resolver columns', () => {
    expect(getPhysicalColumns(mockTemplate)).toHaveLength(2)
  })

  it('getPhysicalColumns includes columns with unknown source type from live API', () => {
    const template = {
      additionalColumns: [
        {
          id: 'col-phone',
          displayName: 'Contact Number',
          type: '576252a9-acc7-4379-b113-15adbffd3e69',
          source: { type: 'unknown-physical-type-uuid', required: true, unique: true },
        },
      ],
    }
    expect(getPhysicalColumns(template)).toHaveLength(1)
  })

  it('normalizeAdditionalColumns accepts string source types', () => {
    const columns = normalizeAdditionalColumns([
      {
        id: 'col-phone',
        displayName: 'Contact Number',
        type: '576252a9-acc7-4379-b113-15adbffd3e69',
        source: PhysicalColumnSourceType,
      },
    ])
    expect(columns).toHaveLength(1)
    expect(getPhysicalColumns({ additionalColumns: columns })).toHaveLength(1)
  })

  it('columnPortType maps Vesta types to engine PortType', () => {
    expect(columnPortType('5b3314a7-31a6-4cc1-8642-6a4cfb2f03a1')).toBe(PortType.String)
    expect(columnPortType('d41cfed6-8c18-47d1-b833-34d3aabf784b')).toBe(PortType.Number)
  })
})

describe('getEventTemplate resolvePorts', () => {
  it('generates dynamic input ports from physical columns only', () => {
    const ports = resolveNodePorts(getEventTemplateDefinition, {
      cachedTemplate: mockTemplate,
    })
    expect(ports.inputSchema.customerName).toBe(PortType.String)
    expect(ports.inputSchema.latitude).toBe(PortType.Number)
    expect(ports.inputSchema.computed).toBeUndefined()
  })
})

describe('getEventTemplate execute', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('fetches template and maps wired column inputs to columnValues', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: [mockTemplate] }),
      }),
    )

    const result = await getEventTemplateDefinition.execute({
      configuration: {
        templateId: 'template-1',
        templateDisplayName: 'Blue store Enquiries',
        cachedTemplate: mockTemplate,
      },
      input: {
        customerName: 'Alice',
        latitude: 12.34,
      },
    })

    expect(result.templateId).toBe('template-1')
    expect(result.displayName).toBe('Blue store Enquiries')
    expect(result.columnValues).toEqual({
      'col-customer-name': 'Alice',
      'col-lat': 12.34,
    })
  })

  it('throws when required columns are missing', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: [mockTemplate] }),
      }),
    )

    await expect(
      getEventTemplateDefinition.execute({
        configuration: {
          templateId: 'template-1',
          templateDisplayName: 'Blue store Enquiries',
          cachedTemplate: mockTemplate,
        },
        input: { latitude: 12.34 },
      }),
    ).rejects.toThrow(/missing required column value\(s\): Customer Name/)
  })
})

describe('registry', () => {
  it('registers getEventTemplate node type', () => {
    expect(getEventTemplateDefinition.type).toBe(NodeType.GetEventTemplate)
  })
})
