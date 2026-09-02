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
import { ResultsPanel } from '../ui/panels/ResultsPanel'
import {
  clearSavedGraph,
  createEmptyGraph,
  createNodeInstance,
  loadLeadCreateTemplate,
  loadGraph,
  parseApiTriggerPayload,
  sanitizeGraph,
  saveGraph,
  schedulePersistGraph,
  type ConnectionMessage,
} from '../ui/state/graphStore'
import type { Graph } from '../engine/graph/types'
import type { NodeType } from '../engine/graph/enums'
import { WorkflowShell } from '../ui/poc/shell/WorkflowShell'
import { WorkflowSidebar } from '../ui/poc/shell/WorkflowSidebar'
import { WorkflowBottomDrawer } from '../ui/poc/shell/WorkflowBottomDrawer'
import { WorkflowConfigPanel } from '../ui/poc/shell/WorkflowConfigPanel'
import { GraphProvider } from '../ui/graph/GraphContext'
import type { WorkflowNodeData } from '../ui/canvas/adapters'

const registry = createRegistry()
registerAll(registry)

function AppShell() {
  const [graph, setGraph] = useState<Graph>(() => loadGraph(registry) ?? createEmptyGraph())
  const [execution, setExecution] = useState<ExecutionContext | null>(null)
  const [connectionMessage, setConnectionMessage] = useState<ConnectionMessage>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [configModalNodeId, setConfigModalNodeId] = useState<string | null>(null)
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
    setSelectedNodeId((current) => (current === nodeId ? null : current))
    setConfigModalNodeId((current) => (current === nodeId ? null : current))
  }, [commitGraph])

  const onOpenConfig = useCallback((nodeId: string) => {
    setSelectedNodeId(nodeId)
    setConfigModalNodeId(nodeId)
  }, [])

  const flowCacheRef = useRef({ nodes: [] as ReturnType<typeof graphToFlow>['nodes'], edges: [] as ReturnType<typeof graphToFlow>['edges'] })
  const { nodes, edges } = useMemo(() => {
    const next = graphToFlow(
      graph,
      execution,
      onConfigChange,
      onConfigBatchChange,
      onDeleteNode,
      onOpenConfig,
      selectedNodeId,
      registry,
      flowCacheRef.current,
    )
    flowCacheRef.current = next
    return next
  }, [graph, execution, onConfigChange, onConfigBatchChange, onDeleteNode, onOpenConfig, selectedNodeId])

  const configModalNodeData = useMemo((): WorkflowNodeData | null => {
    if (!configModalNodeId) return null
    const node = graph.nodes.find((n) => n.id === configModalNodeId)
    if (!node) return null
    return {
      nodeType: node.type,
      label: registry.get(node.type)?.label ?? node.type,
      configuration: node.configuration,
      status: execution?.nodeStatuses[node.id],
      lastOutput: execution?.results[node.id]?.output,
      selected: true,
      onConfigChange,
      onConfigBatchChange,
      onDelete: onDeleteNode,
      onOpenConfig,
    }
  }, [
    configModalNodeId,
    graph.nodes,
    execution,
    onConfigChange,
    onConfigBatchChange,
    onDeleteNode,
    onOpenConfig,
  ])

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
    let triggerPayload: Record<string, unknown> | undefined
    try {
      triggerPayload = parseApiTriggerPayload(graph)
    } catch (err) {
      setIsRunning(false)
      setConnectionMessage({
        code: 'INVALID_TRIGGER',
        message: err instanceof Error ? err.message : 'Invalid API Request JSON on trigger node',
      })
      return
    }

    void runWorkflow(graph, registry, {
      triggerPayload,
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

  const handleLoadTemplate = () => {
    const template = loadLeadCreateTemplate()
    setGraph(template)
    schedulePersistGraph(template)
    setExecution(null)
    setConnectionMessage(null)
    setSelectedNodeId(null)
    setConfigModalNodeId(null)
  }

  const handleLoad = () => {
    const loaded = loadGraph(registry)
    if (loaded) {
      const sanitized = sanitizeGraph(loaded, registry)
      setGraph(sanitized)
      schedulePersistGraph(sanitized)
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
    setSelectedNodeId(null)
    setConfigModalNodeId(null)
  }

  return (
    <GraphProvider graph={graph} execution={execution}>
      <WorkflowShell
        sidebar={
          <WorkflowSidebar
            registry={registry}
            onAddNode={handleAddNode}
            onRun={handleRun}
            onSave={handleSave}
            onLoad={handleLoad}
            onLoadTemplate={handleLoadTemplate}
            onClear={handleClear}
            isRunning={isRunning}
          />
        }
        workspace={
          <>
            <WorkflowCanvas
              registry={registry}
              graph={graph}
              execution={execution}
              nodes={nodes}
              edges={edges}
              onNodesChange={handleNodesChange}
              onEdgesChange={handleEdgesChange}
              onConnect={handleConnect}
              onConnectionMessage={setConnectionMessage}
              getViewportCenterRef={getViewportCenterRef}
              onSelectNode={setSelectedNodeId}
              onOpenConfig={onOpenConfig}
            />
            <WorkflowBottomDrawer isRunning={isRunning} hasExecution={Boolean(execution)}>
              <ResultsPanel
                graph={graph}
                registry={registry}
                execution={execution}
                connectionMessage={connectionMessage}
                isRunning={isRunning}
              />
            </WorkflowBottomDrawer>
          </>
        }
        configPanel={
          configModalNodeId && configModalNodeData ? (
            <WorkflowConfigPanel
              nodeId={configModalNodeId}
              nodeData={configModalNodeData}
              registry={registry}
              onClose={() => setConfigModalNodeId(null)}
              onDelete={() => onDeleteNode(configModalNodeId)}
            />
          ) : null
        }
      />
    </GraphProvider>
  )
}

export default function App() {
  return (
    <AppProvider defaultColorMode="light">
      <AppShell />
    </AppProvider>
  )
}
