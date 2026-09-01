import type { Graph } from '../../engine/graph/types'
import type { ExecutionContext } from '../../engine/runtime/executionContext'
import { createId } from '../../engine/graph/ids'
import { NodeType } from '../../engine/graph/enums'
import type { NodeInstance } from '../../engine/graph/types'

export type ConnectionMessage = {
  code: string
  message: string
} | null

export type WorkflowUiState = {
  graph: Graph
  execution: ExecutionContext | null
  connectionMessage: ConnectionMessage
  isRunning: boolean
}

export function createEmptyGraph(): Graph {
  return {
    id: createId(),
    nodes: [],
    edges: [],
  }
}

export function defaultConfiguration(type: NodeType): Record<string, unknown> {
  switch (type) {
    case NodeType.GenerateNumber:
      return { a: 0 }
    case NodeType.GenerateString:
      return { a: '' }
    case NodeType.ApiRequest:
      return {
        url: 'https://jsonplaceholder.typicode.com/users',
        countPath: '0.count',
        namePath: '0.name',
        locPath: '0.address.city',
      }
    case NodeType.GetEventTemplate:
      return {
        baseUrl: '',
        workspaceId: '',
        accessToken: '',
        templateId: '',
        templateDisplayName: '',
        cachedTemplate: null,
      }
    case NodeType.Addition:
    case NodeType.Concatenation:
      return {}
  }
}

export function createNodeInstance(
  type: NodeType,
  position: { x: number; y: number },
): NodeInstance {
  return {
    id: createId(),
    type,
    position,
    configuration: defaultConfiguration(type),
  }
}

const STORAGE_KEY = 'workflow-engine-graph'

export function saveGraph(graph: Graph): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(graph))
}

export function loadGraph(): Graph | null {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as Graph
  } catch {
    return null
  }
}

export function clearSavedGraph(): void {
  localStorage.removeItem(STORAGE_KEY)
}

let persistTimer: ReturnType<typeof setTimeout> | undefined

/** Debounced auto-save so HMR / refresh does not wipe unsaved work. */
export function schedulePersistGraph(graph: Graph): void {
  if (persistTimer !== undefined) {
    clearTimeout(persistTimer)
  }
  persistTimer = setTimeout(() => {
    saveGraph(graph)
    persistTimer = undefined
  }, 400)
}
