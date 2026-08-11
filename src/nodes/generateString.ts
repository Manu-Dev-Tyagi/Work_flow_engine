import { NodeType, PortType } from '../engine/graph/enums'
import type { NodeDefinition } from '../engine/registry/types'

type Config = { a: string }
type Input = Record<string, never>
type Output = { a: string }

export const generateStringDefinition: NodeDefinition<Config, Input, Output> = {
  type: NodeType.GenerateString,
  label: 'Generate String',
  configurationSchema: { a: PortType.String },
  inputSchema: {},
  outputSchema: { a: PortType.String },
  execute: ({ configuration }) => ({ a: configuration.a }),
}
