import { applyEdgeChanges, applyNodeChanges, type Edge, type EdgeChange, type Node, type NodeChange } from '@xyflow/react'
import type { Graph } from '../../engine/graph/types'

/** Only sync changes that affect persisted graph state — not select/dimensions (breaks inputs). */
export function filterPersistableNodeChanges(changes: NodeChange[]): NodeChange[] {
  return changes.filter((change) => {
    if (change.type === 'position') {
      return change.dragging !== true
    }
    return change.type === 'remove' || change.type === 'add' || change.type === 'replace'
  })
}

export function filterPersistableEdgeChanges(changes: EdgeChange[]): EdgeChange[] {
  return changes.filter((change) => change.type === 'remove' || change.type === 'add' || change.type === 'replace')
}

/** Apply React Flow node changes without dropping nodes on internal remount (remove+add batches). */
export function applyGraphNodeChanges(graph: Graph, changes: NodeChange[]): Graph {
  const flowNodes: Node[] = graph.nodes.map((n) => ({
    id: n.id,
    type: 'workflow',
    position: n.position,
    data: {},
  }))
  const nextFlowNodes = applyNodeChanges(changes, flowNodes)
  const flowNodeById = new Map(nextFlowNodes.map((n) => [n.id, n]))

  return {
    ...graph,
    nodes: graph.nodes
      .filter((n) => flowNodeById.has(n.id))
      .map((n) => ({
        ...n,
        position: flowNodeById.get(n.id)?.position ?? n.position,
      })),
    edges: graph.edges.filter(
      (e) => flowNodeById.has(e.source.nodeId) && flowNodeById.has(e.target.nodeId),
    ),
  }
}

export function applyGraphEdgeChanges(graph: Graph, changes: EdgeChange[]): Graph {
  const flowEdges: Edge[] = graph.edges.map((e) => ({
    id: e.id,
    source: e.source.nodeId,
    target: e.target.nodeId,
    sourceHandle: e.source.port,
    targetHandle: e.target.port,
  }))
  const nextFlowEdges = applyEdgeChanges(changes, flowEdges)
  const flowEdgeById = new Map(nextFlowEdges.map((e) => [e.id, e]))

  return {
    ...graph,
    edges: graph.edges.filter((e) => flowEdgeById.has(e.id)),
  }
}
