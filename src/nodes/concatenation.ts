import { NodeType, PortType } from '../engine/graph/enums'
import type { NodeDefinition } from '../engine/registry/types'

type Config = Record<string, never>
type Input = { a: string; b: string }
type Output = { concatenatedString: string }

export const concatenationDefinition: NodeDefinition<Config, Input, Output> = {
  type: NodeType.Concatenation,
  label: 'Concatenation',
  configurationSchema: {},
  inputSchema: { a: PortType.String, b: PortType.String },
  outputSchema: { concatenatedString: PortType.String },
  execute: ({ input }) => ({ concatenatedString: `${input.a}${input.b}` }),
}
