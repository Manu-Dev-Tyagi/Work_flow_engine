import { NodeType, PortType } from '../engine/graph/enums'
import type { NodeDefinition } from '../engine/registry/types'

type Config = Record<string, never>
type Input = { a: number; b: number }
type Output = { sum: number }

export const additionDefinition: NodeDefinition<Config, Input, Output> = {
  type: NodeType.Addition,
  label: 'Addition',
  configurationSchema: {},
  inputSchema: { a: PortType.Number, b: PortType.Number },
  outputSchema: { sum: PortType.Number },
  execute: ({ input }) => ({ sum: input.a + input.b }),
}
