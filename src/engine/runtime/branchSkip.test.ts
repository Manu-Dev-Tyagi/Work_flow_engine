import { describe, expect, it } from 'vitest'
import { createId } from '../graph/ids'
import { NodeRuntimeStatus, NodeType, WorkflowStatus } from '../graph/enums'
import type { Graph } from '../graph/types'
import { runWorkflow } from '../runWorkflow'
import { createRegistry } from '../registry/registry'
import { registerAll } from '../../nodes'

function registryWithAll() {
  const registry = createRegistry()
  registerAll(registry)
  return registry
}

describe('branch skip runtime', () => {
  it('skips downstream nodes when branch output is undefined', async () => {
    const genId = createId()
    const switchId = createId()
    const mergeId = createId()
    const edgeGenSwitch = createId()
    const edgeSwitchMergeA = createId()
    const edgeSwitchMergeB = createId()

    const graph: Graph = {
      id: createId(),
      nodes: [
        {
          id: genId,
          type: NodeType.GenerateString,
          position: { x: 0, y: 0 },
          configuration: { a: 'lead-1' },
        },
        {
          id: switchId,
          type: NodeType.SwitchEmpty,
          position: { x: 200, y: 0 },
          configuration: {},
        },
        {
          id: mergeId,
          type: NodeType.MergeString,
          position: { x: 400, y: 0 },
          configuration: {},
        },
      ],
      edges: [
        {
          id: edgeGenSwitch,
          source: { nodeId: genId, port: 'a' },
          target: { nodeId: switchId, port: 'containerId' },
        },
        {
          id: edgeSwitchMergeA,
          source: { nodeId: switchId, port: 'whenFound' },
          target: { nodeId: mergeId, port: 'existingId' },
        },
        {
          id: edgeSwitchMergeB,
          source: { nodeId: switchId, port: 'whenNotFound' },
          target: { nodeId: mergeId, port: 'createdId' },
        },
      ],
    }

    const ctx = await runWorkflow(graph, registryWithAll())
    expect(ctx.status).toBe(WorkflowStatus.Completed)
    expect(ctx.nodeStatuses[switchId]).toBe(NodeRuntimeStatus.Completed)
    expect(ctx.nodeStatuses[mergeId]).toBe(NodeRuntimeStatus.Completed)
    expect(ctx.results[mergeId]?.output).toEqual({ containerId: 'lead-1' })
    expect(edgeSwitchMergeA in ctx.edgeValues).toBe(true)
    expect(edgeSwitchMergeB in ctx.edgeValues).toBe(false)
  })
})
