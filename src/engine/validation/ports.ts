import { ValidationErrorCode } from '../graph/enums'
import type { PortType } from '../graph/enums'
import type { Graph } from '../graph/types'
import type { Registry } from '../registry/registry'
import type { ValidationError } from './types'

/** Shared port-type equality check used by validation and UI isValidConnection. */
export function portsCompatible(sourceType: PortType, targetType: PortType): boolean {
  return sourceType === targetType
}

export function describeTypeMismatch(
  sourceType: PortType,
  targetType: PortType,
): string {
  return `Type mismatch: expected ${targetType}, received ${sourceType}`
}

export function validatePorts(graph: Graph, registry: Registry): ValidationError[] {
  const errors: ValidationError[] = []
  const nodeById = new Map(graph.nodes.map((n) => [n.id, n]))

  for (const edge of graph.edges) {
    const sourceNode = nodeById.get(edge.source.nodeId)
    const targetNode = nodeById.get(edge.target.nodeId)
    if (!sourceNode || !targetNode) continue

    const sourceDef = registry.get(sourceNode.type)
    const targetDef = registry.get(targetNode.type)
    if (!sourceDef || !targetDef) continue

    const sourcePortType = sourceDef.outputSchema[edge.source.port]
    const targetPortType = targetDef.inputSchema[edge.target.port]
    if (sourcePortType === undefined || targetPortType === undefined) continue

    if (!portsCompatible(sourcePortType, targetPortType)) {
      errors.push({
        code: ValidationErrorCode.TypeMismatch,
        message: `${describeTypeMismatch(sourcePortType, targetPortType)} on edge ${edge.id} (${edge.source.port} → ${edge.target.port})`,
        nodeId: targetNode.id,
        edgeId: edge.id,
      })
    }
  }

  return errors
}
