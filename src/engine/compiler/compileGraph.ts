import type { NodeId } from '../graph/ids'
import type { CompiledGraph, EdgeInstance, Graph } from '../graph/types'
import { buildAdjacency, topologicalSort } from './topologicalSort'

export function compileGraph(graph: Graph): CompiledGraph {
  const nodeById = new Map(graph.nodes.map((n) => [n.id, n]))
  const { adjacency, reverseAdjacency, indegree } = buildAdjacency(graph)

  const incomingEdges = new Map<NodeId, EdgeInstance[]>()
  const outgoingEdges = new Map<NodeId, EdgeInstance[]>()

  for (const node of graph.nodes) {
    incomingEdges.set(node.id, [])
    outgoingEdges.set(node.id, [])
  }

  for (const edge of graph.edges) {
    incomingEdges.get(edge.target.nodeId)?.push(edge)
    outgoingEdges.get(edge.source.nodeId)?.push(edge)
  }

  const executionOrder = topologicalSort(
    graph.nodes.map((n) => n.id),
    adjacency,
    indegree,
  )

  return {
    executionOrder,
    adjacency,
    reverseAdjacency,
    indegree,
    incomingEdges,
    outgoingEdges,
    nodeById,
  }
}
