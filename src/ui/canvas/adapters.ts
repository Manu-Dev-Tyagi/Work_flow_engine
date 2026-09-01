import type { Edge, Node } from '@xyflow/react'
import type { Graph, NodeInstance } from '../../engine/graph/types'
import type { ExecutionContext } from '../../engine/runtime/executionContext'
import { NodeRuntimeStatus } from '../../engine/graph/enums'
import type { Registry } from '../../engine/registry/registry'
import { resolveNodePorts } from '../../engine/registry/resolvePorts'
import { portTypeLabel } from '../poc/nodes/nodeDisplay'

export type WorkflowNodeData = {
  nodeType: NodeInstance['type']
  label: string
  configuration: Record<string, unknown>
  status?: NodeRuntimeStatus
  lastOutput?: Record<string, unknown>
  selected?: boolean
  onConfigChange: (nodeId: string, key: string, value: unknown) => void
  onConfigBatchChange: (nodeId: string, patch: Record<string, unknown>) => void
  onDelete: (nodeId: string) => void
  onOpenConfig: (nodeId: string) => void
}

export function graphToFlow(
  graph: Graph,
  execution: ExecutionContext | null,
  onConfigChange: (nodeId: string, key: string, value: unknown) => void,
  onConfigBatchChange: (nodeId: string, patch: Record<string, unknown>) => void,
  onDelete: (nodeId: string) => void,
  onOpenConfig: (nodeId: string) => void,
  selectedNodeId: string | null,
  registry: Registry,
  previous?: { nodes: Node<WorkflowNodeData>[]; edges: Edge[] },
): { nodes: Node<WorkflowNodeData>[]; edges: Edge[] } {
  const previousNodes = new Map((previous?.nodes ?? []).map((node) => [node.id, node]))
  const nodes: Node<WorkflowNodeData>[] = graph.nodes.map((n) => {
    const status = execution?.nodeStatuses[n.id]
    const lastOutput = execution?.results[n.id]?.output
    const previousNode = previousNodes.get(n.id)
    if (
      previousNode &&
      previousNode.position === n.position &&
      previousNode.data.nodeType === n.type &&
      previousNode.data.configuration === n.configuration &&
      previousNode.data.status === status &&
      previousNode.data.lastOutput === lastOutput &&
      previousNode.data.onConfigChange === onConfigChange &&
      previousNode.data.onConfigBatchChange === onConfigBatchChange &&
      previousNode.data.onDelete === onDelete &&
      previousNode.data.onOpenConfig === onOpenConfig &&
      previousNode.data.selected === (selectedNodeId === n.id)
    ) {
      return previousNode
    }
    return {
      id: n.id,
      type: 'workflow',
      position: n.position,
      selected: selectedNodeId === n.id,
      data: {
        nodeType: n.type,
        label: registry.get(n.type)?.label ?? n.type,
        configuration: n.configuration,
        status,
        lastOutput,
        selected: selectedNodeId === n.id,
        onConfigChange,
        onConfigBatchChange,
        onDelete,
        onOpenConfig,
      },
    }
  })

  const edges: Edge[] = graph.edges.map((e) => {
    const displayValue = execution?.edgeDisplayValues[e.id]
    const sourceNode = graph.nodes.find((n) => n.id === e.source.nodeId)
    const targetNode = graph.nodes.find((n) => n.id === e.target.nodeId)
    const sourceDef = sourceNode ? registry.get(sourceNode.type) : undefined
    const targetDef = targetNode ? registry.get(targetNode.type) : undefined
    const sourcePorts = sourceDef && sourceNode
      ? resolveNodePorts(sourceDef, sourceNode.configuration)
      : null
    const targetPorts = targetDef && targetNode
      ? resolveNodePorts(targetDef, targetNode.configuration)
      : null
    const sourceType = sourcePorts?.outputSchema[e.source.port]
    const targetType = targetPorts?.inputSchema[e.target.port]
    const portLabel =
      sourceType && targetType
        ? `${e.source.port} (${portTypeLabel(sourceType)}) → ${e.target.port} (${portTypeLabel(targetType)})`
        : `${e.source.port} → ${e.target.port}`
    const label =
      displayValue !== undefined
        ? `${e.source.port}: ${displayValue}`
        : portLabel

    return {
      id: e.id,
      source: e.source.nodeId,
      target: e.target.nodeId,
      sourceHandle: e.source.port,
      targetHandle: e.target.port,
      label,
      labelStyle: { fontSize: 10, fill: '#64748b', fontWeight: 500 },
      labelBgStyle: { fill: '#ffffff', fillOpacity: 0.92 },
      labelBgPadding: [4, 6] as [number, number],
      labelBgBorderRadius: 4,
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

export function updateNodeConfigurationBatch(
  graph: Graph,
  nodeId: string,
  patch: Record<string, unknown>,
): Graph {
  return {
    ...graph,
    nodes: graph.nodes.map((n) =>
      n.id === nodeId
        ? { ...n, configuration: { ...n.configuration, ...patch } }
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
