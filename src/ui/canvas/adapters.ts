import type { Edge, Node } from '@xyflow/react'
import type { Graph, NodeInstance } from '../../engine/graph/types'
import type { NodeType } from '../../engine/graph/enums'
import type { ExecutionContext } from '../../engine/runtime/executionContext'
import { NodeRuntimeStatus } from '../../engine/graph/enums'

export type WorkflowNodeData = {
  nodeType: NodeType
  label: string
  configuration: Record<string, unknown>
  status?: NodeRuntimeStatus
  lastOutput?: Record<string, unknown>
  onConfigChange: (nodeId: string, key: string, value: unknown) => void
  onDelete: (nodeId: string) => void
}

export function graphToFlow(
  graph: Graph,
  execution: ExecutionContext | null,
  onConfigChange: (nodeId: string, key: string, value: unknown) => void,
  onDelete: (nodeId: string) => void,
  labels: Record<NodeType, string>,
): { nodes: Node<WorkflowNodeData>[]; edges: Edge[] } {
  const nodes: Node<WorkflowNodeData>[] = graph.nodes.map((n) => ({
    id: n.id,
    type: 'workflow',
    position: n.position,
    data: {
      nodeType: n.type,
      label: labels[n.type] ?? n.type,
      configuration: n.configuration,
      status: execution?.nodeStatuses[n.id],
      lastOutput: execution?.results[n.id]?.output,
      onConfigChange,
      onDelete,
    },
  }))

  const edges: Edge[] = graph.edges.map((e) => {
    const value = execution?.edgeValues[e.id]
    const label =
      value === undefined
        ? undefined
        : typeof value === 'string'
          ? value
          : typeof value === 'number' || typeof value === 'boolean'
            ? String(value)
            : JSON.stringify(value)

    return {
      id: e.id,
      source: e.source.nodeId,
      target: e.target.nodeId,
      sourceHandle: e.source.port,
      targetHandle: e.target.port,
      label,
      animated: execution?.nodeStatuses[e.source.nodeId] === NodeRuntimeStatus.Running,
      style: {
        stroke:
          execution?.nodeStatuses[e.source.nodeId] === NodeRuntimeStatus.Completed
            ? '#22a06b'
            : '#8590a2',
      },
    }
  })

  return { nodes, edges }
}

export function applyNodePositions(graph: Graph, flowNodes: Node[]): Graph {
  const positions = new Map(flowNodes.map((n) => [n.id, n.position]))
  return {
    ...graph,
    nodes: graph.nodes.map((n) => ({
      ...n,
      position: positions.get(n.id) ?? n.position,
    })),
  }
}

export function updateNodeConfiguration(
  graph: Graph,
  nodeId: string,
  key: string,
  value: unknown,
): Graph {
  return {
    ...graph,
    nodes: graph.nodes.map((n) =>
      n.id === nodeId
        ? { ...n, configuration: { ...n.configuration, [key]: value } }
        : n,
    ),
  }
}

export function removeNodesAndEdges(graph: Graph, nodeIds: string[], edgeIds: string[]): Graph {
  const nodeIdSet = new Set(nodeIds)
  const edgeIdSet = new Set(edgeIds)
  return {
    ...graph,
    nodes: graph.nodes.filter((n) => !nodeIdSet.has(n.id)),
    edges: graph.edges.filter(
      (e) =>
        !edgeIdSet.has(e.id) &&
        !nodeIdSet.has(e.source.nodeId) &&
        !nodeIdSet.has(e.target.nodeId),
    ),
  }
}

export function addNodeToGraph(graph: Graph, node: NodeInstance): Graph {
  return { ...graph, nodes: [...graph.nodes, node] }
}
