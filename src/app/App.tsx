import { useCallback, useMemo, useState } from 'react'
import type { Connection, OnEdgesChange, OnNodesChange } from '@xyflow/react'
import AppProvider from '@atlaskit/app-provider'
import { createRegistry } from '../engine/registry/registry'
import { runWorkflow } from '../engine/runWorkflow'
import { createId } from '../engine/graph/ids'
import type { ExecutionContext } from '../engine/runtime/executionContext'
import { registerAll } from '../nodes'
import { WorkflowCanvas } from '../ui/canvas/WorkflowCanvas'
import { graphToFlow, updateNodeConfiguration } from '../ui/canvas/adapters'
import { ToolbarPanel } from '../ui/panels/ToolbarPanel'
import { ResultsPanel } from '../ui/panels/ResultsPanel'
import {
  createEmptyGraph,
  createNodeInstance,
  loadGraph,
  saveGraph,
  type ConnectionMessage,
} from '../ui/state/graphStore'
import type { Graph } from '../engine/graph/types'
import type { NodeType } from '../engine/graph/enums'
import { NodeType as NodeTypeEnum } from '../engine/graph/enums'

const registry = createRegistry()
registerAll(registry)

const NODE_LABELS: Record<NodeType, string> = {
  [NodeTypeEnum.GenerateNumber]: 'Generate Number',
  [NodeTypeEnum.Addition]: 'Addition',
  [NodeTypeEnum.GenerateString]: 'Generate String',
  [NodeTypeEnum.Concatenation]: 'Concatenation',
}

function AppShell() {
  const [graph, setGraph] = useState<Graph>(() => loadGraph() ?? createEmptyGraph())
  const [execution, setExecution] = useState<ExecutionContext | null>(null)
  const [connectionMessage, setConnectionMessage] = useState<ConnectionMessage>(null)
  const [isRunning, setIsRunning] = useState(false)

  const onConfigChange = useCallback((nodeId: string, key: string, value: unknown) => {
    setGraph((current) => updateNodeConfiguration(current, nodeId, key, value))
    setExecution(null)
  }, [])

  const { nodes, edges } = useMemo(
    () => graphToFlow(graph, execution, onConfigChange, NODE_LABELS),
    [graph, execution, onConfigChange],
  )

  const handleNodesChange: OnNodesChange = (changes) => {
    const removed = changes.some((change) => change.type === 'remove')
    setGraph((current) => {
      let next = current
      for (const change of changes) {
        if (change.type === 'position' && change.position) {
          next = {
            ...next,
            nodes: next.nodes.map((n) =>
              n.id === change.id ? { ...n, position: change.position! } : n,
            ),
          }
        }
        if (change.type === 'remove') {
          const nodeId = change.id
          next = {
            ...next,
            nodes: next.nodes.filter((n) => n.id !== nodeId),
            edges: next.edges.filter(
              (e) => e.source.nodeId !== nodeId && e.target.nodeId !== nodeId,
            ),
          }
        }
      }
      return next
    })
    if (removed) {
      setExecution(null)
    }
  }

  const handleEdgesChange: OnEdgesChange = (changes) => {
    const removed = changes.some((change) => change.type === 'remove')
    setGraph((current) => {
      let next = current
      for (const change of changes) {
        if (change.type === 'remove') {
          next = {
            ...next,
            edges: next.edges.filter((e) => e.id !== change.id),
          }
        }
      }
      return next
    })
    if (removed) {
      setExecution(null)
    }
  }

  const handleConnect = (connection: Connection) => {
    if (!connection.source || !connection.target || !connection.sourceHandle || !connection.targetHandle) {
      return
    }
    setGraph((current) => ({
      ...current,
      edges: [
        ...current.edges,
        {
          id: createId(),
          source: { nodeId: connection.source!, port: connection.sourceHandle! },
          target: { nodeId: connection.target!, port: connection.targetHandle! },
        },
      ],
    }))
    setExecution(null)
  }

  const handleAddNode = (type: NodeType) => {
    const offset = graph.nodes.length * 24
    setGraph((current) => ({
      ...current,
      nodes: [
        ...current.nodes,
        createNodeInstance(type, { x: 80 + offset, y: 80 + offset }),
      ],
    }))
    setExecution(null)
  }

  const handleRun = () => {
    setIsRunning(true)
    setConnectionMessage(null)
    void runWorkflow(graph, registry, {
      stepDelayMs: 350,
      onContextUpdate: (ctx) => setExecution(ctx),
    }).then((ctx) => {
      setExecution(ctx)
      setIsRunning(false)
    })
  }

  const handleSave = () => {
    saveGraph(graph)
  }

  const handleLoad = () => {
    const loaded = loadGraph()
    if (loaded) {
      setGraph(loaded)
      setExecution(null)
      setConnectionMessage(null)
    }
  }

  return (
    <div className="grid h-screen w-screen grid-cols-[240px_1fr_320px] grid-rows-1 bg-slate-100 text-slate-900">
      <ToolbarPanel
        registry={registry}
        onAddNode={handleAddNode}
        onRun={handleRun}
        onSave={handleSave}
        onLoad={handleLoad}
        isRunning={isRunning}
      />
      <main className="relative min-h-0 min-w-0">
        <WorkflowCanvas
          registry={registry}
          graph={graph}
          nodes={nodes}
          edges={edges}
          onNodesChange={handleNodesChange}
          onEdgesChange={handleEdgesChange}
          onConnect={handleConnect}
          onConnectionMessage={setConnectionMessage}
        />
      </main>
      <ResultsPanel
        graph={graph}
        execution={execution}
        connectionMessage={connectionMessage}
        isRunning={isRunning}
      />
    </div>
  )
}

export default function App() {
  return (
    <AppProvider defaultColorMode="light">
      <AppShell />
    </AppProvider>
  )
}
