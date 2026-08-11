import type { CompiledGraph } from '../graph/types'
import type { ExecutionContext } from './executionContext'

export function resolveInputs(
  compiled: CompiledGraph,
  nodeId: string,
  ctx: ExecutionContext,
): Record<string, unknown> {
  const input: Record<string, unknown> = {}
  const incoming = compiled.incomingEdges.get(nodeId) ?? []

  for (const edge of incoming) {
    input[edge.target.port] = ctx.edgeValues[edge.id]
  }

  return input
}
