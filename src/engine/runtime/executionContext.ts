import {
  LogLevel,
  NodeRuntimeStatus,
  ValidationErrorCode,
  WorkflowStatus,
} from '../graph/enums'
import type { EdgeId, NodeId } from '../graph/ids'

export type NodeResult = {
  input: Record<string, unknown>
  output: Record<string, unknown>
  durationMs: number
}

export type ExecutionLog = {
  level: LogLevel
  message: string
  at: number
  nodeId?: NodeId
}

export type ExecutionContext = {
  status: WorkflowStatus
  nodeStatuses: Record<NodeId, NodeRuntimeStatus>
  results: Record<NodeId, NodeResult>
  edgeValues: Record<EdgeId, unknown>
  logs: ExecutionLog[]
  executionOrder: NodeId[]
  triggerPayload?: Record<string, unknown>
  httpResponse?: {
    status: number
    body: Record<string, unknown>
  }
  error?: {
    code?: ValidationErrorCode
    message: string
    nodeId?: NodeId
  }
}

export function createIdleContext(nodeIds: NodeId[] = []): ExecutionContext {
  const nodeStatuses: Record<NodeId, NodeRuntimeStatus> = {}
  for (const id of nodeIds) {
    nodeStatuses[id] = NodeRuntimeStatus.Waiting
  }

  return {
    status: WorkflowStatus.Idle,
    nodeStatuses,
    results: {},
    edgeValues: {},
    logs: [],
    executionOrder: [],
  }
}

export function appendLog(
  ctx: ExecutionContext,
  level: LogLevel,
  message: string,
  nodeId?: NodeId,
): void {
  ctx.logs.push({ level, message, at: Date.now(), nodeId })
}
