import { describe, expect, it } from 'vitest'
import { createRegistry } from '../../engine/registry/registry'
import { registerAll } from '../../nodes'
import { validateGraph } from '../../engine/validation/validateGraph'
import { leadCreateTemplate } from './leadCreate'

describe('leadCreateTemplate', () => {
  it('is structurally valid when templates are configured', () => {
    const registry = createRegistry()
    registerAll(registry)

    const graph = structuredClone(leadCreateTemplate)
    const getTemplate = graph.nodes.find((n) => n.type === 'getEventTemplate')
    const getContainerTemplate = graph.nodes.find((n) => n.type === 'getEventContainerTemplate')
    const findContainer = graph.nodes.find((n) => n.type === 'findEventContainer')
    if (getTemplate) {
      getTemplate.configuration.templateId = '11111111-1111-4111-8111-111111111111'
    }
    if (getContainerTemplate) {
      getContainerTemplate.configuration.templateId = '22222222-2222-4222-8222-222222222222'
    }
    if (findContainer) {
      findContainer.configuration.matchColumnId = '33333333-3333-4333-8333-333333333333'
    }

    const result = validateGraph(graph, registry)
    expect(result.ok).toBe(true)
  })
})
