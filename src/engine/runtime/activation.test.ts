import { describe, expect, it } from 'vitest'
import { createId } from '../graph/ids'
import { NodeType } from '../graph/enums'
import type { CompiledGraph, Graph } from '../graph/types'
import { compileGraph } from '../compiler/compileGraph'
import { createRegistry } from '../registry/registry'
import { registerAll } from '../../nodes'
import { isNodeActivated } from './activation'
import { createIdleContext } from './executionContext'

function compiledFrom(graph: Graph): CompiledGraph {
  return compileGraph(graph)
}

describe('isNodeActivated', () => {
  it('ignores non-activation inputs when activation ports are defined', () => {
    const registry = createRegistry()
    registerAll(registry)

    const sourceId = createId()
    const createContainerId = createId()
    const edgeTemplate = createId()
    const graph: Graph = {
      id: createId(),
      nodes: [
        {
          id: sourceId,
          type: NodeType.GenerateString,
          position: { x: 0, y: 0 },
          configuration: { a: 'template-1' },
        },
        {
          id: createContainerId,
          type: NodeType.CreateEventContainer,
          position: { x: 200, y: 0 },
          configuration: {},
        },
      ],
      edges: [
        {
          id: edgeTemplate,
          source: { nodeId: sourceId, port: 'a' },
          target: { nodeId: createContainerId, port: 'templateId' },
        },
      ],
    }
    const compiled = compiledFrom(graph)
    const definition = registry.get(NodeType.CreateEventContainer)!
    const ctx = createIdleContext([sourceId, createContainerId])
    ctx.edgeValues[edgeTemplate] = 'template-1'

    expect(
      isNodeActivated(compiled, createContainerId, ctx, definition, {}),
    ).toBe(false)
  })

  it('activates when a configured activation port receives a value', () => {
    const registry = createRegistry()
    registerAll(registry)

    const sourceId = createId()
    const createContainerId = createId()
    const edgeGate = createId()
    const graph: Graph = {
      id: createId(),
      nodes: [
        {
          id: sourceId,
          type: NodeType.GenerateString,
          position: { x: 0, y: 0 },
          configuration: { a: 'go' },
        },
        {
          id: createContainerId,
          type: NodeType.CreateEventContainer,
          position: { x: 200, y: 0 },
          configuration: {},
        },
      ],
      edges: [
        {
          id: edgeGate,
          source: { nodeId: sourceId, port: 'a' },
          target: { nodeId: createContainerId, port: 'gate' },
        },
      ],
    }
    const compiled = compiledFrom(graph)
    const definition = registry.get(NodeType.CreateEventContainer)!
    const ctx = createIdleContext([sourceId, createContainerId])
    ctx.edgeValues[edgeGate] = 'go'

    expect(
      isNodeActivated(compiled, createContainerId, ctx, definition, {}),
    ).toBe(true)
  })
})
