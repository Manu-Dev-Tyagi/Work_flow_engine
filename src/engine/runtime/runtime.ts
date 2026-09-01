import { LogLevel, NodeRuntimeStatus, PortType, WorkflowStatus } from '../graph/enums'
import type { CompiledGraph } from '../graph/types'
import type { Registry } from '../registry/registry'
import {
  appendLog,
  createIdleContext,
  type ExecutionContext,
} from './executionContext'
import { isNodeActivated } from './activation'
import { resolveNodePorts } from '../registry/resolvePorts'
import { resolveInputs } from './resolveInputs'
import { formatEdgeDisplayValue } from './edgeDisplay'
import type { NodeRunContext, RunWorkflowOptions } from './runContext'

export type RuntimeHooks = Pick<RunWorkflowOptions, 'onContextUpdate' | 'stepDelayMs'>

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function execute(
  compiled: CompiledGraph,
  registry: Registry,
  options: RunWorkflowOptions = {},
): Promise<ExecutionContext> {
  const ctx = createIdleContext([...compiled.nodeById.keys()])
  ctx.status = WorkflowStatus.Running
  ctx.executionOrder = [...compiled.executionOrder]
  if (options.triggerPayload) {
    ctx.triggerPayload = options.triggerPayload
  }
  appendLog(ctx, LogLevel.Info, 'Workflow execution started')
  options.onContextUpdate?.(structuredClone(ctx))

  const runContext: NodeRunContext = {
    triggerPayload: options.triggerPayload,
    setHttpResponse: (response) => {
      ctx.httpResponse = response
    },
  }

  for (const nodeId of compiled.executionOrder) {
    const node = compiled.nodeById.get(nodeId)
    if (!node) {
      ctx.status = WorkflowStatus.Failed
      ctx.error = { message: `Missing node ${nodeId} in compiled graph` }
      appendLog(ctx, LogLevel.Error, ctx.error.message)
      options.onContextUpdate?.(structuredClone(ctx))
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
      options.onContextUpdate?.(structuredClone(ctx))
      return ctx
    }

    if (!isNodeActivated(compiled, nodeId, ctx, definition, node.configuration)) {
      ctx.nodeStatuses[nodeId] = NodeRuntimeStatus.Skipped
      appendLog(ctx, LogLevel.Info, `Skipped ${node.type} (branch not taken)`, nodeId)
      options.onContextUpdate?.(structuredClone(ctx))
      continue
    }

    ctx.nodeStatuses[nodeId] = NodeRuntimeStatus.Running
    appendLog(ctx, LogLevel.Info, `Started ${node.type}`, nodeId)
    options.onContextUpdate?.(structuredClone(ctx))

    if (options.stepDelayMs && options.stepDelayMs > 0) {
      await sleep(options.stepDelayMs)
    }

    const startedAt = performance.now()
    try {
      const input = resolveInputs(compiled, nodeId, ctx)
      const output = await definition.execute({
        configuration: node.configuration,
        input,
        run: runContext,
      })
      const durationMs = performance.now() - startedAt

      ctx.results[nodeId] = { input, output, durationMs }

      const outputPorts = resolveNodePorts(definition, node.configuration).outputSchema

      for (const edge of compiled.outgoingEdges.get(nodeId) ?? []) {
        const value = output[edge.source.port]
        if (value !== undefined) {
          ctx.edgeValues[edge.id] = value
          const portType = outputPorts[edge.source.port]
          ctx.edgeDisplayValues[edge.id] = formatEdgeDisplayValue({
            sourceNode: node,
            sourcePort: edge.source.port,
            portType: portType ?? PortType.String,
            value,
            output,
          })
        }
      }

      ctx.nodeStatuses[nodeId] = NodeRuntimeStatus.Completed
      appendLog(
        ctx,
        LogLevel.Info,
        `Completed ${node.type} in ${durationMs.toFixed(2)}ms`,
        nodeId,
      )
      options.onContextUpdate?.(structuredClone(ctx))
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      ctx.status = WorkflowStatus.Failed
      ctx.nodeStatuses[nodeId] = NodeRuntimeStatus.Failed
      ctx.error = { message, nodeId }
      appendLog(ctx, LogLevel.Error, message, nodeId)
      options.onContextUpdate?.(structuredClone(ctx))
      return ctx
    }
  }

  ctx.status = WorkflowStatus.Completed
  appendLog(ctx, LogLevel.Info, 'Workflow execution completed')
  options.onContextUpdate?.(structuredClone(ctx))
  return ctx
}
