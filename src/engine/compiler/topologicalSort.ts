import type { NodeId } from '../graph/ids'
import type { Graph } from '../graph/types'

export function topologicalSort(
  nodeIds: NodeId[],
  adjacency: Map<NodeId, NodeId[]>,
  indegree: Map<NodeId, number>,
): NodeId[] {
  const indegreeCopy = new Map(indegree)
  const queue: NodeId[] = nodeIds.filter((id) => (indegreeCopy.get(id) ?? 0) === 0)
  const order: NodeId[] = []

  while (queue.length > 0) {
    const current = queue.shift()!
    order.push(current)

    for (const neighbor of adjacency.get(current) ?? []) {
      const next = (indegreeCopy.get(neighbor) ?? 0) - 1
      indegreeCopy.set(neighbor, next)
      if (next === 0) {
        queue.push(neighbor)
      }
    }
  }

  if (order.length !== nodeIds.length) {
    throw new Error('Cannot compile graph: cycle detected during topological sort')
  }

  return order
}

export function buildAdjacency(graph: Graph): {
  adjacency: Map<NodeId, NodeId[]>
  reverseAdjacency: Map<NodeId, NodeId[]>
  indegree: Map<NodeId, number>
} {
  const adjacency = new Map<NodeId, NodeId[]>()
  const reverseAdjacency = new Map<NodeId, NodeId[]>()
  const indegree = new Map<NodeId, number>()

  for (const node of graph.nodes) {
    adjacency.set(node.id, [])
    reverseAdjacency.set(node.id, [])
    indegree.set(node.id, 0)
  }

  for (const edge of graph.edges) {
    const forward = adjacency.get(edge.source.nodeId)
    const reverse = reverseAdjacency.get(edge.target.nodeId)
    if (!forward || !reverse) {
      throw new Error(`Cannot compile graph: edge ${edge.id} references missing node`)
    }

    if (!forward.includes(edge.target.nodeId)) {
      forward.push(edge.target.nodeId)
      indegree.set(edge.target.nodeId, (indegree.get(edge.target.nodeId) ?? 0) + 1)
    }

    if (!reverse.includes(edge.source.nodeId)) {
      reverse.push(edge.source.nodeId)
    }
  }

  return { adjacency, reverseAdjacency, indegree }
}
