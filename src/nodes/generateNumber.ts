import { NodeType, PortType } from '../engine/graph/enums'
import type { NodeDefinition } from '../engine/registry/types'

type Config = { a: number }
type Input = Record<string, never>
type Output = { a: number }

export const generateNumberDefinition: NodeDefinition<Config, Input, Output> = {
  type: NodeType.GenerateNumber,
  label: 'Generate Number',
  configurationSchema: { a: PortType.Number },
  inputSchema: {},
  outputSchema: { a: PortType.Number },
  execute: ({ configuration }) => ({ a: configuration.a }),
}
