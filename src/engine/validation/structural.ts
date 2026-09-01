import { ValidationErrorCode } from '../graph/enums'
import type { Graph } from '../graph/types'
import type { Registry } from '../registry/registry'
import { resolveNodePorts, resolveOptionalInputPorts } from '../registry/resolvePorts'
import type { ValidationError } from './types'

export function validateStructural(graph: Graph, registry: Registry): ValidationError[] {
  const errors: ValidationError[] = []
  const nodeById = new Map(graph.nodes.map((n) => [n.id, n]))

  for (const node of graph.nodes) {
    if (!registry.has(node.type)) {
      errors.push({
        code: ValidationErrorCode.UnknownNodeType,
        message: `Unknown node type "${node.type}" on node ${node.id}`,
        nodeId: node.id,
      })
    }
  }

  const inputOccupancy = new Map<string, string>()

  for (const edge of graph.edges) {
    const sourceNode = nodeById.get(edge.source.nodeId)
    const targetNode = nodeById.get(edge.target.nodeId)

    if (!sourceNode) {
      errors.push({
        code: ValidationErrorCode.MissingNode,
        message: `Edge ${edge.id} references missing source node ${edge.source.nodeId}`,
        edgeId: edge.id,
      })
      continue
    }

    if (!targetNode) {
      errors.push({
        code: ValidationErrorCode.MissingNode,
        message: `Edge ${edge.id} references missing target node ${edge.target.nodeId}`,
        edgeId: edge.id,
      })
      continue
    }

    const occupancyKey = `${edge.target.nodeId}::${edge.target.port}`
    const existing = inputOccupancy.get(occupancyKey)
    if (existing) {
      errors.push({
        code: ValidationErrorCode.DuplicateInputConnection,
        message: `Input port "${edge.target.port}" on node ${edge.target.nodeId} has multiple incoming edges`,
        nodeId: edge.target.nodeId,
        edgeId: edge.id,
      })
    } else {
      inputOccupancy.set(occupancyKey, edge.id)
    }

    const sourceDef = registry.get(sourceNode.type)
    const targetDef = registry.get(targetNode.type)

    if (sourceDef) {
      const sourcePorts = resolveNodePorts(sourceDef, sourceNode.configuration)
      if (!(edge.source.port in sourcePorts.outputSchema)) {
        errors.push({
          code: ValidationErrorCode.UnknownPort,
          message: `Unknown output port "${edge.source.port}" on node type ${sourceNode.type}`,
          nodeId: sourceNode.id,
          edgeId: edge.id,
        })
      }
    }

    if (targetDef) {
      const targetPorts = resolveNodePorts(targetDef, targetNode.configuration)
      if (!(edge.target.port in targetPorts.inputSchema)) {
        errors.push({
          code: ValidationErrorCode.UnknownPort,
          message: `Unknown input port "${edge.target.port}" on node type ${targetNode.type}`,
          nodeId: targetNode.id,
          edgeId: edge.id,
        })
      }
    }
  }

  for (const node of graph.nodes) {
    const definition = registry.get(node.type)
    if (!definition) continue

    const { inputSchema } = resolveNodePorts(definition, node.configuration)
    const optionalPorts = resolveOptionalInputPorts(definition, node.configuration)
    for (const port of Object.keys(inputSchema)) {
      if (optionalPorts.has(port)) continue
      const key = `${node.id}::${port}`
      if (!inputOccupancy.has(key)) {
        errors.push({
          code: ValidationErrorCode.MissingRequiredInput,
          message: `Required input "${port}" on node ${node.id} (${node.type}) is not connected`,
          nodeId: node.id,
        })
      }
    }
  }

  return errors
}
