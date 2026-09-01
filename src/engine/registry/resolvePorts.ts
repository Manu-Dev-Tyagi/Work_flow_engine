import type { PortType } from '../graph/enums'
import type { AnyNodeDefinition } from './types'

export type ResolvedPortSchemas = {
  inputSchema: Record<string, PortType>
  outputSchema: Record<string, PortType>
}

export function resolveNodePorts(
  definition: AnyNodeDefinition,
  configuration: Record<string, unknown>,
): ResolvedPortSchemas {
  if (definition.resolvePorts) {
    return definition.resolvePorts(configuration)
  }
  return {
    inputSchema: { ...definition.inputSchema },
    outputSchema: { ...definition.outputSchema },
  }
}

export function resolveOptionalInputPorts(
  definition: AnyNodeDefinition,
  configuration: Record<string, unknown>,
): ReadonlySet<string> {
  if (definition.resolveOptionalInputPorts) {
    return new Set(definition.resolveOptionalInputPorts(configuration))
  }
  return new Set()
}
