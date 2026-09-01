import { NodeType, PortType } from '../engine/graph/enums'
import type { NodeDefinition } from '../engine/registry/types'

type Config = Record<string, never>

type Input = {
  /** Id from an existing Journey (Find branch). */
  existingId?: string
  /** Id from a newly created Journey (Create branch). */
  createdId?: string
}

type Output = {
  containerId: string
}

export const mergeStringDefinition: NodeDefinition<Config, Input, Output> = {
  type: NodeType.MergeString,
  label: 'Coalesce Container Id',
  configurationSchema: {},
  inputSchema: {
    existingId: PortType.String,
    createdId: PortType.String,
  },
  outputSchema: {
    containerId: PortType.String,
  },
  resolveOptionalInputPorts() {
    return ['existingId', 'createdId']
  },
  resolveActivationInputPorts() {
    return ['existingId', 'createdId']
  },
  execute: ({ input }) => {
    const existingId = input.existingId !== undefined ? String(input.existingId) : undefined
    const createdId = input.createdId !== undefined ? String(input.createdId) : undefined
    const containerId = existingId ?? createdId
    if (containerId === undefined) {
      throw new Error('Coalesce Container Id: wire existingId or createdId')
    }
    return { containerId }
  },
}
