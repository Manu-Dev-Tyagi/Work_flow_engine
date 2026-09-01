import { useCallback, useMemo, useRef, useState } from 'react'
import type { Connection, OnEdgesChange, OnNodesChange } from '@xyflow/react'
import AppProvider from '@atlaskit/app-provider'
import { createRegistry } from '../engine/registry/registry'
import { runWorkflow } from '../engine/runWorkflow'
import { createId } from '../engine/graph/ids'
import type { ExecutionContext } from '../engine/runtime/executionContext'
import { registerAll } from '../nodes'
import {
  WorkflowCanvas,
  type ViewportCenterGetter,
} from '../ui/canvas/WorkflowCanvas'
import { graphToFlow, updateNodeConfiguration, updateNodeConfigurationBatch } from '../ui/canvas/adapters'
import { applyGraphEdgeChanges, applyGraphNodeChanges, filterPersistableEdgeChanges, filterPersistableNodeChanges } from '../ui/canvas/graphSync'
import { ToolbarPanel } from '../ui/panels/ToolbarPanel'
import { ResultsPanel } from '../ui/panels/ResultsPanel'
import {
  clearSavedGraph,
  createEmptyGraph,
  createNodeInstance,
  loadGraph,
  saveGraph,
  schedulePersistGraph,
  type ConnectionMessage,
} from '../ui/state/graphStore'
import type { Graph } from '../engine/graph/types'
import type { NodeType } from '../engine/graph/enums'

const registry = createRegistry()
registerAll(registry)

function AppShell() {
  const [graph, setGraph] = useState<Graph>(() => loadGraph() ?? createEmptyGraph())
  const [execution, setExecution] = useState<ExecutionContext | null>(null)
  const [connectionMessage, setConnectionMessage] = useState<ConnectionMessage>(null)
  const [isRunning, setIsRunning] = useState(false)
  const getViewportCenterRef = useRef<ViewportCenterGetter>(() => ({ x: 80, y: 80 }))

  const commitGraph = useCallback((updater: (current: Graph) => Graph) => {
    setGraph((current) => {
      const next = updater(current)
      schedulePersistGraph(next)
      return next
    })
  }, [])

  const onConfigChange = useCallback((nodeId: string, key: string, value: unknown) => {
    commitGraph((current) => updateNodeConfiguration(current, nodeId, key, value))
  }, [commitGraph])

  const onConfigBatchChange = useCallback((nodeId: string, patch: Record<string, unknown>) => {
    commitGraph((current) => updateNodeConfigurationBatch(current, nodeId, patch))
    setExecution(null)
  }, [commitGraph])

  const onDeleteNode = useCallback((nodeId: string) => {
    commitGraph((current) => ({
      ...current,
      nodes: current.nodes.filter((n) => n.id !== nodeId),
      edges: current.edges.filter(
        (e) => e.source.nodeId !== nodeId && e.target.nodeId !== nodeId,
      ),
    }))
    setExecution(null)
  }, [commitGraph])

  const flowCacheRef = useRef({ nodes: [] as ReturnType<typeof graphToFlow>['nodes'], edges: [] as ReturnType<typeof graphToFlow>['edges'] })
  const { nodes, edges } = useMemo(() => {
    const next = graphToFlow(
      graph,
      execution,
      onConfigChange,
      onConfigBatchChange,
      onDeleteNode,
      registry,
      flowCacheRef.current,
    )
    flowCacheRef.current = next
    return next
  }, [graph, execution, onConfigChange, onConfigBatchChange, onDeleteNode])

  const handleNodesChange: OnNodesChange = (changes) => {
    const persistable = filterPersistableNodeChanges(changes)
    if (persistable.length === 0) return

    const removed = persistable.some((change) => change.type === 'remove')
    commitGraph((current) => applyGraphNodeChanges(current, persistable))
    if (removed) {
      setExecution(null)
    }
  }

  const handleEdgesChange: OnEdgesChange = (changes) => {
    const persistable = filterPersistableEdgeChanges(changes)
    if (persistable.length === 0) return

    const removed = persistable.some((change) => change.type === 'remove')
    commitGraph((current) => applyGraphEdgeChanges(current, persistable))
    if (removed) {
      setExecution(null)
    }
  }

  const handleConnect = (connection: Connection) => {
    if (!connection.source || !connection.target || !connection.sourceHandle || !connection.targetHandle) {
      return
    }
    commitGraph((current) => ({
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
    const position = getViewportCenterRef.current()
    commitGraph((current) => ({
      ...current,
      nodes: [...current.nodes, createNodeInstance(type, position)],
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
      schedulePersistGraph(loaded)
      setExecution(null)
      setConnectionMessage(null)
    }
  }

  const handleClear = () => {
    if (!window.confirm('Clear the entire canvas? This removes all nodes and edges.')) {
      return
    }
    const empty = createEmptyGraph()
    clearSavedGraph()
    setGraph(empty)
    setExecution(null)
    setConnectionMessage(null)
  }

  return (
    <div className="grid h-screen w-screen grid-cols-[240px_1fr_320px] grid-rows-1 bg-slate-100 text-slate-900">
      <ToolbarPanel
        registry={registry}
        onAddNode={handleAddNode}
        onRun={handleRun}
        onSave={handleSave}
        onLoad={handleLoad}
        onClear={handleClear}
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
          getViewportCenterRef={getViewportCenterRef}
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
