import { NodeType, PortType } from '../engine/graph/enums'
import type { NodeDefinition } from '../engine/registry/types'

/** Common Ottopilot / lead-create HTTP response property names. */
export const OTTOPILOT_RESPONSE_FIELD_PRESETS = [
  'eventContainerId',
  'eventId',
  'templateId',
  'contactNumber',
  'customerName',
] as const

type Config = {
  firstKey: string
  secondKey: string
}

type Input = {
  first: string
  second: string
}

type Output = {
  object: Record<string, unknown>
}

export const objectFromKeysDefinition: NodeDefinition<Config, Input, Output> = {
  type: NodeType.ObjectFromKeys,
  label: 'Shape API Response',
  configurationSchema: {
    firstKey: PortType.String,
    secondKey: PortType.String,
  },
  inputSchema: {
    first: PortType.String,
    second: PortType.String,
  },
  outputSchema: {
    object: PortType.Object,
  },
  execute: ({ configuration, input }) => {
    const firstKey = String(configuration.firstKey ?? '').trim()
    const secondKey = String(configuration.secondKey ?? '').trim()
    if (!firstKey || !secondKey) {
      throw new Error('Shape API Response: set firstKey and secondKey in configuration')
    }
    return {
      object: {
        [firstKey]: String(input.first ?? ''),
        [secondKey]: String(input.second ?? ''),
      },
    }
  },
}
