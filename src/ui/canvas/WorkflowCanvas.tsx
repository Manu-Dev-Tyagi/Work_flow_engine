import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  type Connection,
  type Edge,
  type Node,
  type OnEdgesChange,
  type OnNodesChange,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useMemo } from 'react'
import type { Registry } from '../../engine/registry/registry'
import type { Graph } from '../../engine/graph/types'
import { createWorkflowNodeType } from '../nodes/WorkflowNode'
import type { WorkflowNodeData } from './adapters'
import { checkConnection } from './connectionValidation'
import type { ConnectionMessage } from '../state/graphStore'

type Props = {
  registry: Registry
  graph: Graph
  nodes: Node<WorkflowNodeData>[]
  edges: Edge[]
  onNodesChange: OnNodesChange
  onEdgesChange: OnEdgesChange
  onConnect: (connection: Connection) => void
  onConnectionMessage: (message: ConnectionMessage) => void
}

export function WorkflowCanvas({
  registry,
  graph,
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onConnectionMessage,
}: Props) {
  const nodeTypes = useMemo(
    () => ({
      workflow: createWorkflowNodeType(registry),
    }),
    [registry],
  )

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
    <div className="relative h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={handleConnect}
        isValidConnection={isValidConnection}
        fitView
        deleteKeyCode={['Backspace', 'Delete']}
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  )
}
