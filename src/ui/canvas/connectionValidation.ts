import type { Connection } from '@xyflow/react'
import { ValidationErrorCode, type PortType } from '../../engine/graph/enums'
import type { Graph } from '../../engine/graph/types'
import type { Registry } from '../../engine/registry/registry'
import { resolveNodePorts } from '../../engine/registry/resolvePorts'
import {
  describeTypeMismatch,
  portsCompatible,
} from '../../engine/validation/ports'
import type { ConnectionMessage } from '../state/graphStore'

export type ConnectionCheck = {
  valid: boolean
  message: ConnectionMessage
}

export function resolveHandlePortType(
  graph: Graph,
  registry: Registry,
  nodeId: string | null | undefined,
  handleId: string | null | undefined,
  handleType: 'source' | 'target' | null | undefined,
): PortType | undefined {
  if (!nodeId || !handleId || !handleType) return undefined

  const node = graph.nodes.find((n) => n.id === nodeId)
  if (!node) return undefined

  const definition = registry.get(node.type)
  if (!definition) return undefined

  const ports = resolveNodePorts(definition, node.configuration)
  return handleType === 'source'
    ? ports.outputSchema[handleId]
    : ports.inputSchema[handleId]
}

export function canConnectToInput(
  drag: { nodeId: string; handleType: 'source' | 'target'; portType: PortType } | null,
  targetNodeId: string,
  targetPortType: PortType,
): boolean {
  if (!drag || drag.handleType !== 'source') return true
  if (drag.nodeId === targetNodeId) return false
  return portsCompatible(drag.portType, targetPortType)
}

export function checkConnection(
  graph: Graph,
  registry: Registry,
  connection: Connection,
): ConnectionCheck {
  const sourceNode = graph.nodes.find((n) => n.id === connection.source)
  const targetNode = graph.nodes.find((n) => n.id === connection.target)

  if (!sourceNode || !targetNode || !connection.sourceHandle || !connection.targetHandle) {
    return {
      valid: false,
      message: {
        code: ValidationErrorCode.MissingNode,
        message: 'Invalid connection endpoints',
      },
    }
  }

  if (connection.source === connection.target) {
    return {
      valid: false,
      message: {
        code: ValidationErrorCode.CycleDetected,
        message: 'Cannot connect a node to itself',
      },
    }
  }

  const sourceDef = registry.get(sourceNode.type)
  const targetDef = registry.get(targetNode.type)
  if (!sourceDef || !targetDef) {
    return {
      valid: false,
      message: {
        code: ValidationErrorCode.UnknownNodeType,
        message: 'Unknown node type in connection',
      },
    }
  }

  const sourcePorts = resolveNodePorts(sourceDef, sourceNode.configuration)
  const targetPorts = resolveNodePorts(targetDef, targetNode.configuration)

  const sourcePort = connection.sourceHandle
  const targetPort = connection.targetHandle
  const sourceType = sourcePorts.outputSchema[sourcePort]
  const targetType = targetPorts.inputSchema[targetPort]

  if (sourceType === undefined) {
    return {
      valid: false,
      message: {
        code: ValidationErrorCode.UnknownPort,
        message: `Unknown output port "${sourcePort}"`,
      },
    }
  }

  if (targetType === undefined) {
    return {
      valid: false,
      message: {
        code: ValidationErrorCode.UnknownPort,
        message: `Unknown input port "${targetPort}"`,
      },
    }
  }

  if (!portsCompatible(sourceType, targetType)) {
    return {
      valid: false,
      message: {
        code: ValidationErrorCode.TypeMismatch,
        message: describeTypeMismatch(sourceType, targetType),
      },
    }
  }

  const occupied = graph.edges.some(
    (e) =>
      e.target.nodeId === connection.target && e.target.port === connection.targetHandle,
  )
  if (occupied) {
    return {
      valid: false,
      message: {
        code: ValidationErrorCode.DuplicateInputConnection,
        message: `Input port "${targetPort}" is already connected`,
      },
    }
  }

  return { valid: true, message: null }
}
