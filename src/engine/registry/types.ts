import type { NodeType, PortType } from '../graph/enums'

export type NodeDefinition<
  C extends Record<string, unknown> = Record<string, unknown>,
  I extends Record<string, unknown> = Record<string, unknown>,
  O extends Record<string, unknown> = Record<string, unknown>,
> = {
  type: NodeType
  label: string
  configurationSchema: { [K in keyof C]: PortType }
  inputSchema: { [K in keyof I]: PortType }
  outputSchema: { [K in keyof O]: PortType }
  execute: (args: { configuration: C; input: I }) => O | Promise<O>
}

export type AnyNodeDefinition = NodeDefinition<
  Record<string, unknown>,
  Record<string, unknown>,
  Record<string, unknown>
>
