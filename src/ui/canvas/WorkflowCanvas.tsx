import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  useReactFlow,
  type Connection,
  type Edge,
  type Node,
  type OnEdgesChange,
  type OnNodesChange,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useLayoutEffect, useRef, type MutableRefObject } from 'react'
import type { Registry } from '../../engine/registry/registry'
import type { Graph } from '../../engine/graph/types'
import type { ExecutionContext } from '../../engine/runtime/executionContext'
import { GraphProvider } from '../graph/GraphContext'
import { createWorkflowNodeType } from '../nodes/WorkflowNode'
import type { WorkflowNodeData } from './adapters'
import { checkConnection } from './connectionValidation'
import type { ConnectionMessage } from '../state/graphStore'

/** Approx half of a workflow node so the card sits visually centered. */
const NODE_ANCHOR = { x: 110, y: 48 }

/** Uniform minimap tiles — tall config panels should not dominate the overview. */
const MINIMAP_NODE_SIZE = { width: 48, height: 32 }

export type ViewportCenterGetter = () => { x: number; y: number }

type Props = {
  registry: Registry
  execution: ExecutionContext | null
  graph: Graph
  nodes: Node<WorkflowNodeData>[]
  edges: Edge[]
  onNodesChange: OnNodesChange<Node<WorkflowNodeData>>
  onEdgesChange: OnEdgesChange
  onConnect: (connection: Connection) => void
  onConnectionMessage: (message: ConnectionMessage) => void
  getViewportCenterRef: MutableRefObject<ViewportCenterGetter>
}

/** Fit view once per page load — avoid jumping viewport on every graph update. */
let hasInitialFitView = false

/** Keep React Flow selection/dimensions local; sync data + position from graph. */
function mergeFlowNodes(
  current: Node<WorkflowNodeData>[],
  fromGraph: Node<WorkflowNodeData>[],
): Node<WorkflowNodeData>[] {
  const currentById = new Map(current.map((node) => [node.id, node]))
  return fromGraph.map((node) => {
    const previous = currentById.get(node.id)
    if (!previous) return node
    if (previous.data === node.data && previous.position === node.position) {
      return previous
    }
    return {
      ...previous,
      data: node.data,
      position: node.position,
    }
  })
}

function mergeFlowEdges(current: Edge[], fromGraph: Edge[]): Edge[] {
  const currentById = new Map(current.map((edge) => [edge.id, edge]))
  return fromGraph.map((edge) => {
    const previous = currentById.get(edge.id)
    if (!previous) return edge
    if (
      previous.source === edge.source &&
      previous.target === edge.target &&
      previous.sourceHandle === edge.sourceHandle &&
      previous.targetHandle === edge.targetHandle &&
      previous.label === edge.label
    ) {
      return previous
    }
    return {
      ...previous,
      ...edge,
    }
  })
}

function sameItems<T>(left: T[], right: T[]): boolean {
  if (left.length !== right.length) return false
  return left.every((item, index) => item === right[index])
}

function WorkflowCanvasInner({
  registry,
  graph,
  execution,
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onConnectionMessage,
  getViewportCenterRef,
}: Props) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const { screenToFlowPosition } = useReactFlow()
  const [flowNodes, setFlowNodes, onFlowNodesChange] = useNodesState<Node<WorkflowNodeData>>(nodes)
  const [flowEdges, setFlowEdges, onFlowEdgesChange] = useEdgesState(edges)

  const nodeTypes = useRef({
    workflow: createWorkflowNodeType(registry),
  }).current

  useLayoutEffect(() => {
    setFlowNodes((current) => {
      const merged = mergeFlowNodes(current, nodes)
      return sameItems(current, merged) ? current : merged
    })
    setFlowEdges((current) => {
      const merged = mergeFlowEdges(current, edges)
      return sameItems(current, merged) ? current : merged
    })
  }, [nodes, edges, setFlowNodes, setFlowEdges])

  const handleNodesChange: OnNodesChange<Node<WorkflowNodeData>> = (changes) => {
    onFlowNodesChange(changes)
    onNodesChange(changes)
  }

  const handleEdgesChange: OnEdgesChange = (changes) => {
    onFlowEdgesChange(changes)
    onEdgesChange(changes)
  }

  getViewportCenterRef.current = () => {
    const el = wrapperRef.current
    if (!el) {
      return { x: 80, y: 80 }
    }
    const rect = el.getBoundingClientRect()
    const flowPoint = screenToFlowPosition({
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    })
    return {
      x: flowPoint.x - NODE_ANCHOR.x,
      y: flowPoint.y - NODE_ANCHOR.y,
    }
  }

  const isValidConnection = (connection: Connection | Edge) => {
    const result = checkConnection(graph, registry, connection as Connection)
    return result.valid
  }

  const handleConnect = (connection: Connection) => {
    const result = checkConnection(graph, registry, connection)
    if (!result.valid) {
      onConnectionMessage(result.message)
      return
    }
    onConnectionMessage(null)
    onConnect(connection)
  }

  return (
    <GraphProvider graph={graph} execution={execution}>
      <div ref={wrapperRef} className="relative h-full w-full">
        <ReactFlow
        nodes={flowNodes}
        edges={flowEdges}
        nodeTypes={nodeTypes}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={handleConnect}
        isValidConnection={isValidConnection}
        onlyRenderVisibleElements
        onInit={(instance) => {
          if (!hasInitialFitView) {
            hasInitialFitView = true
            void instance.fitView({ padding: 0.2 })
          }
        }}
        deleteKeyCode={['Backspace', 'Delete']}
      >
        <Background />
        <Controls />
        <MiniMap
          className="workflow-minimap"
          pannable
          zoomable
          nodeColor="#3b82f6"
          nodeStrokeColor="#1e40af"
          nodeStrokeWidth={2}
          nodeBorderRadius={4}
          bgColor="#e2e8f0"
          maskColor="rgba(15, 23, 42, 0.12)"
          style={{ width: 180, height: 120 }}
          nodeComponent={({ x, y, color }) => (
            <rect
              x={x}
              y={y}
              width={MINIMAP_NODE_SIZE.width}
              height={MINIMAP_NODE_SIZE.height}
              rx={4}
              ry={4}
              fill={color}
              stroke="#1e40af"
              strokeWidth={2}
            />
          )}
        />
      </ReactFlow>
      </div>
    </GraphProvider>
  )
}

export function WorkflowCanvas(props: Props) {
  return (
    <ReactFlowProvider>
      <WorkflowCanvasInner {...props} />
    </ReactFlowProvider>
  )
}
