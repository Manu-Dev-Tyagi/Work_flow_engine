import { describe, expect, it, vi, afterEach } from 'vitest'
import { NodeType, PortType } from '../engine/graph/enums'
import { resolveNodePorts } from '../engine/registry/resolvePorts'
import { getEventContainerTemplateDefinition } from './getEventContainerTemplate'
import { PhysicalColumnSourceType } from '../integrations/vesta/types'

const mockTemplate = {
  id: 'container-template-1',
  displayName: 'Lead',
  additionalColumns: [
    {
      id: 'col-phone',
      displayName: 'Contact Number',
      type: '576252a9-acc7-4379-b113-15adbffd3e69',
      source: { type: PhysicalColumnSourceType, required: true, unique: true },
    },
  ],
}

describe('getEventContainerTemplate resolvePorts', () => {
  it('generates dynamic input ports from physical columns', () => {
    const ports = resolveNodePorts(getEventContainerTemplateDefinition, {
      cachedContainerTemplate: mockTemplate,
    })
    expect(ports.inputSchema.contactNumber).toBe(PortType.String)
  })
})

describe('getEventContainerTemplate execute', () => {
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

    const result = await getEventContainerTemplateDefinition.execute({
      configuration: {
        templateId: 'container-template-1',
        templateDisplayName: 'Lead',
        cachedContainerTemplate: mockTemplate,
      },
      input: {
        contactNumber: '+911234567890',
      },
    })

    expect(result.templateId).toBe('container-template-1')
    expect(result.displayName).toBe('Lead')
    expect(result.columnValues).toEqual({ 'col-phone': '+911234567890' })
  })
})

describe('registry', () => {
  it('registers getEventContainerTemplate node type', () => {
    expect(getEventContainerTemplateDefinition.type).toBe(NodeType.GetEventContainerTemplate)
  })
})
