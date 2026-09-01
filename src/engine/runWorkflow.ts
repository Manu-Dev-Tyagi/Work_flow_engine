import { compileGraph } from './compiler/compileGraph'
import { LogLevel, WorkflowStatus } from './graph/enums'
import type { Graph } from './graph/types'
import type { Registry } from './registry/registry'
import {
  appendLog,
  createIdleContext,
  type ExecutionContext,
} from './runtime/executionContext'
import type { RunWorkflowOptions } from './runtime/runContext'
import { execute } from './runtime/runtime'
import { validateGraph } from './validation/validateGraph'

export type { RunWorkflowOptions } from './runtime/runContext'

export async function runWorkflow(
  graph: Graph,
  registry: Registry,
  options: RunWorkflowOptions = {},
): Promise<ExecutionContext> {
  const validation = validateGraph(graph, registry)

  if (!validation.ok) {
    const ctx = createIdleContext(graph.nodes.map((n) => n.id))
    ctx.status = WorkflowStatus.Failed
    const first = validation.errors[0]
    ctx.error = {
      code: first?.code,
      message: validation.errors.map((e) => e.message).join('; '),
      nodeId: first?.nodeId,
    }
    for (const error of validation.errors) {
      appendLog(ctx, LogLevel.Error, error.message, error.nodeId)
    }
    options.onContextUpdate?.(structuredClone(ctx))
    return ctx
  }

  const compiled = compileGraph(graph)
  return execute(compiled, registry, options)
}
