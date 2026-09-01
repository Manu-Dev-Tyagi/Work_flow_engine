import type { NodeType, PortType } from '../graph/enums'
import type { ResolvedPortSchemas } from './resolvePorts'

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
  /** Resolve dynamic ports from node configuration (e.g. cached Ottopilot template). */
  resolvePorts?: (configuration: C) => ResolvedPortSchemas
  /** Input ports that may remain unwired (config provides fallback or field is optional). */
  resolveOptionalInputPorts?: (configuration: C) => ReadonlyArray<string>
  execute: (args: { configuration: C; input: I }) => O | Promise<O>
}

export type AnyNodeDefinition = NodeDefinition<
  Record<string, unknown>,
  Record<string, unknown>,
  Record<string, unknown>
>
