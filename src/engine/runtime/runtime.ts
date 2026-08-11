import { LogLevel, NodeRuntimeStatus, WorkflowStatus } from '../graph/enums'
import type { CompiledGraph } from '../graph/types'
import type { Registry } from '../registry/registry'
import {
  appendLog,
  createIdleContext,
  type ExecutionContext,
} from './executionContext'
import { resolveInputs } from './resolveInputs'

export type RuntimeHooks = {
  onContextUpdate?: (ctx: ExecutionContext) => void
  /** Artificial delay per node for UI animation (ms). */
  stepDelayMs?: number
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function execute(
  compiled: CompiledGraph,
  registry: Registry,
  hooks: RuntimeHooks = {},
): Promise<ExecutionContext> {
  const ctx = createIdleContext([...compiled.nodeById.keys()])
  ctx.status = WorkflowStatus.Running
  ctx.executionOrder = [...compiled.executionOrder]
  appendLog(ctx, LogLevel.Info, 'Workflow execution started')
  hooks.onContextUpdate?.(structuredClone(ctx))

  for (const nodeId of compiled.executionOrder) {
    const node = compiled.nodeById.get(nodeId)
    if (!node) {
      ctx.status = WorkflowStatus.Failed
      ctx.error = { message: `Missing node ${nodeId} in compiled graph` }
      appendLog(ctx, LogLevel.Error, ctx.error.message)
      hooks.onContextUpdate?.(structuredClone(ctx))
      return ctx
    }

    const definition = registry.get(node.type)
    if (!definition) {
      ctx.status = WorkflowStatus.Failed
      ctx.nodeStatuses[nodeId] = NodeRuntimeStatus.Failed
      ctx.error = {
        message: `No registry definition for type ${node.type}`,
        nodeId,
      }
      appendLog(ctx, LogLevel.Error, ctx.error.message, nodeId)
      hooks.onContextUpdate?.(structuredClone(ctx))
      return ctx
    }

    ctx.nodeStatuses[nodeId] = NodeRuntimeStatus.Running
    appendLog(ctx, LogLevel.Info, `Started ${node.type}`, nodeId)
    hooks.onContextUpdate?.(structuredClone(ctx))

    if (hooks.stepDelayMs && hooks.stepDelayMs > 0) {
      await sleep(hooks.stepDelayMs)
    }

    const startedAt = performance.now()
    try {
      const input = resolveInputs(compiled, nodeId, ctx)
      const output = await definition.execute({
        configuration: node.configuration,
        input,
      })
      const durationMs = performance.now() - startedAt

      ctx.results[nodeId] = { input, output, durationMs }

      for (const edge of compiled.outgoingEdges.get(nodeId) ?? []) {
        ctx.edgeValues[edge.id] = output[edge.source.port]
      }

      ctx.nodeStatuses[nodeId] = NodeRuntimeStatus.Completed
      appendLog(
        ctx,
        LogLevel.Info,
        `Completed ${node.type} in ${durationMs.toFixed(2)}ms`,
        nodeId,
      )
      hooks.onContextUpdate?.(structuredClone(ctx))
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      ctx.status = WorkflowStatus.Failed
      ctx.nodeStatuses[nodeId] = NodeRuntimeStatus.Failed
      ctx.error = { message, nodeId }
      appendLog(ctx, LogLevel.Error, message, nodeId)
      hooks.onContextUpdate?.(structuredClone(ctx))
      return ctx
    }
  }

  ctx.status = WorkflowStatus.Completed
  appendLog(ctx, LogLevel.Info, 'Workflow execution completed')
  hooks.onContextUpdate?.(structuredClone(ctx))
  return ctx
}
