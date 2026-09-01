import type { CompiledGraph } from '../graph/types'
import type { AnyNodeDefinition } from '../registry/types'
import { resolveActivationInputPorts } from '../registry/resolvePorts'
import type { ExecutionContext } from './executionContext'

export function isNodeActivated(
  compiled: CompiledGraph,
  nodeId: string,
  ctx: ExecutionContext,
  definition: AnyNodeDefinition,
  configuration: Record<string, unknown>,
): boolean {
  const incoming = compiled.incomingEdges.get(nodeId) ?? []
  if (incoming.length === 0) return true

  const activationPorts = resolveActivationInputPorts(definition, configuration)
  for (const edge of incoming) {
    if (!(edge.id in ctx.edgeValues)) continue
    if (activationPorts === null || activationPorts.has(edge.target.port)) {
      return true
    }
  }
  return false
}
