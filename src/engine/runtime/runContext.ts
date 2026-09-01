import type { ExecutionContext } from './executionContext'

export type HttpResponse = {
  status: number
  body: Record<string, unknown>
}

export type NodeRunContext = {
  triggerPayload?: Record<string, unknown>
  setHttpResponse: (response: HttpResponse) => void
}

export type RunWorkflowOptions = {
  onContextUpdate?: (ctx: ExecutionContext) => void
  /** Artificial delay per node for UI animation (ms). */
  stepDelayMs?: number
  /** Incoming HTTP body for http.trigger nodes (overrides node config sample). */
  triggerPayload?: Record<string, unknown>
}
