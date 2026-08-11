import type { NodeType } from './enums'
import type { EdgeId, GraphId, NodeId } from './ids'

export type PortRef = {
  nodeId: NodeId
  port: string
}

export type NodeInstance = {
  id: NodeId
  type: NodeType
  position: { x: number; y: number }
  configuration: Record<string, unknown>
}

export type EdgeInstance = {
  id: EdgeId
  source: PortRef
  target: PortRef
}

export type Graph = {
  id: GraphId
  nodes: NodeInstance[]
  edges: EdgeInstance[]
}

export type CompiledGraph = {
  executionOrder: NodeId[]
  adjacency: Map<NodeId, NodeId[]>
  reverseAdjacency: Map<NodeId, NodeId[]>
  indegree: Map<NodeId, number>
  incomingEdges: Map<NodeId, EdgeInstance[]>
  outgoingEdges: Map<NodeId, EdgeInstance[]>
  nodeById: Map<NodeId, NodeInstance>
}
