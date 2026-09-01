import type { NodeType, PortType } from '../graph/enums'
import type { ResolvedPortSchemas } from './resolvePorts'
import type { NodeRunContext } from '../runtime/runContext'

export type NodeExecuteArgs<
  C extends Record<string, unknown>,
  I extends Record<string, unknown>,
> = {
  configuration: C
  input: I
  run?: NodeRunContext
}

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
  /** When set, the node runs only if at least one of these inputs received a value on its wire. */
  resolveActivationInputPorts?: (configuration: C) => ReadonlyArray<string>
  execute: (args: NodeExecuteArgs<C, I>) => O | Promise<O>
}

export type AnyNodeDefinition = NodeDefinition<
  Record<string, unknown>,
  Record<string, unknown>,
  Record<string, unknown>
>
