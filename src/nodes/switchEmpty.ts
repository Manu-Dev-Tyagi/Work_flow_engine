import { NodeType, PortType } from '../engine/graph/enums'
import type { NodeDefinition } from '../engine/registry/types'

type Config = Record<string, never>

type Input = {
  /** Event container id from Find Event Container (empty when no Journey match). */
  containerId: string
}

type Output = {
  /** Find returned no container — take the create-Journey branch. */
  whenNotFound?: string
  /** Find returned an existing container id — take the existing-Journey branch. */
  whenFound?: string
}

export const switchEmptyDefinition: NodeDefinition<Config, Input, Output> = {
  type: NodeType.SwitchEmpty,
  label: 'Branch: Container Match',
  configurationSchema: {},
  inputSchema: {
    containerId: PortType.String,
  },
  outputSchema: {
    whenNotFound: PortType.String,
    whenFound: PortType.String,
  },
  execute: ({ input }) => {
    const containerId = String(input.containerId ?? '')
    if (containerId.trim() === '') {
      return { whenNotFound: containerId }
    }
    return { whenFound: containerId }
  },
}
