import { createContext, useContext, type ReactNode } from 'react'
import type { Graph } from '../../engine/graph/types'
import type { ExecutionContext } from '../../engine/runtime/executionContext'

type WorkflowGraphContextValue = {
  graph: Graph
  execution: ExecutionContext | null
}

const GraphContext = createContext<WorkflowGraphContextValue | null>(null)

export function GraphProvider({
  graph,
  execution,
  children,
}: {
  graph: Graph
  execution: ExecutionContext | null
  children: ReactNode
}) {
  return <GraphContext.Provider value={{ graph, execution }}>{children}</GraphContext.Provider>
}

export function useWorkflowGraph(): WorkflowGraphContextValue {
  const value = useContext(GraphContext)
  if (!value) {
    throw new Error('useWorkflowGraph must be used within GraphProvider')
  }
  return value
}
