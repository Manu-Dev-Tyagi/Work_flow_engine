import { compileGraph } from './compiler/compileGraph'
import { LogLevel, WorkflowStatus } from './graph/enums'
import type { Graph } from './graph/types'
import type { Registry } from './registry/registry'
import {
  appendLog,
  createIdleContext,
  type ExecutionContext,
} from './runtime/executionContext'
import { execute, type RuntimeHooks } from './runtime/runtime'
import { validateGraph } from './validation/validateGraph'

export async function runWorkflow(
  graph: Graph,
  registry: Registry,
  hooks: RuntimeHooks = {},
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
    hooks.onContextUpdate?.(structuredClone(ctx))
    return ctx
  }

  const compiled = compileGraph(graph)
  return execute(compiled, registry, hooks)
}
