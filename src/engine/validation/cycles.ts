import { ValidationErrorCode } from '../graph/enums'
import type { NodeId } from '../graph/ids'
import type { Graph } from '../graph/types'
import type { ValidationError } from './types'

enum VisitState {
  Unvisited = 0,
  Visiting = 1,
  Visited = 2,
}

export function validateCycles(graph: Graph): ValidationError[] {
  const adjacency = new Map<NodeId, NodeId[]>()
  for (const node of graph.nodes) {
    adjacency.set(node.id, [])
  }
  for (const edge of graph.edges) {
    const list = adjacency.get(edge.source.nodeId)
    if (list && !list.includes(edge.target.nodeId)) {
      list.push(edge.target.nodeId)
    }
  }

  const state = new Map<NodeId, VisitState>()
  for (const node of graph.nodes) {
    state.set(node.id, VisitState.Unvisited)
  }

  const errors: ValidationError[] = []
  const stack: NodeId[] = []

  const visit = (nodeId: NodeId): void => {
    state.set(nodeId, VisitState.Visiting)
    stack.push(nodeId)

    for (const neighbor of adjacency.get(nodeId) ?? []) {
      const neighborState = state.get(neighbor) ?? VisitState.Unvisited
      if (neighborState === VisitState.Visiting) {
        const cycleStart = stack.indexOf(neighbor)
        const path = [...stack.slice(cycleStart), neighbor].join(' → ')
        errors.push({
          code: ValidationErrorCode.CycleDetected,
          message: `Cycle detected: ${path}`,
          nodeId: neighbor,
        })
      } else if (neighborState === VisitState.Unvisited) {
        visit(neighbor)
      }
    }

    stack.pop()
    state.set(nodeId, VisitState.Visited)
  }

  for (const node of graph.nodes) {
    if (state.get(node.id) === VisitState.Unvisited) {
      visit(node.id)
    }
  }

  return errors
}
