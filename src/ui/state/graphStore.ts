import type { Graph } from '../../engine/graph/types'
import type { ExecutionContext } from '../../engine/runtime/executionContext'
import { createId } from '../../engine/graph/ids'
import { NodeType } from '../../engine/graph/enums'
import type { NodeInstance } from '../../engine/graph/types'
import {
  leadCreateTemplate,
  LEAD_CREATE_TRIGGER_JSON,
} from '../../fixtures/templates/leadCreate'

export { LEAD_CREATE_TRIGGER_JSON }

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
        sampleBody: LEAD_CREATE_TRIGGER_JSON,
        matchField: 'contactNumber',
      }
    case NodeType.GetEventTemplate:
      return {
        templateId: '',
        templateDisplayName: '',
        cachedTemplate: null,
      }
    case NodeType.GetEventContainerTemplate:
      return {
        templateId: '',
        templateDisplayName: '',
        cachedContainerTemplate: null,
      }
    case NodeType.CreateEvent:
      return {}
    case NodeType.FindEventContainer:
      return {
        matchColumnId: '',
        matchColumnDisplayName: '',
      }
    case NodeType.CreateEventContainer:
      return { organizationalUnitId: '', organizationalUnitDisplayName: '' }
    case NodeType.SwitchEmpty:
    case NodeType.MergeString:
      return {}
    case NodeType.HttpRespond:
      return { statusCode: 200 }
    case NodeType.ObjectFromKeys:
      return { firstKey: 'eventContainerId', secondKey: 'eventId' }
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

export function loadLeadCreateTemplate(): Graph {
  return structuredClone(leadCreateTemplate)
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
