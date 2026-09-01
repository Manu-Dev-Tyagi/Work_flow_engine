import { NodeType, PortType } from '../engine/graph/enums'
import type { NodeDefinition } from '../engine/registry/types'
import { findEventContainers } from '../integrations/vesta/eventContainersApi'
import { resolvePlutoAuth, type PlutoAuth } from '../integrations/vesta/plutoClient'

type Config = {
  matchColumnId: string
  matchColumnDisplayName: string
}

type Input = {
  templateId: string
  matchValue: string
  matchColumnId?: string
  accessToken?: string
  workspaceId?: string
}

type Output = {
  eventContainerId: string
  container: Record<string, unknown>
}

function resolveAuth(input: Input): PlutoAuth {
  return resolvePlutoAuth({
    workspaceId: input.workspaceId ? String(input.workspaceId) : undefined,
    accessToken: input.accessToken ? String(input.accessToken) : undefined,
  })
}

function resolveMatchColumnId(configuration: Config, input: Input): string {
  const wired = String(input.matchColumnId ?? '').trim()
  if (wired) return wired

  const configured = String(configuration.matchColumnId ?? '').trim()
  if (!configured) {
    throw new Error(
      'Find Event Container: select a match column in node configuration, or wire matchColumnId',
    )
  }
  return configured
}

export const findEventContainerDefinition: NodeDefinition<Config, Input, Output> = {
  type: NodeType.FindEventContainer,
  label: 'Find Event Container',
  configurationSchema: {
    matchColumnId: PortType.String,
    matchColumnDisplayName: PortType.String,
  },
  inputSchema: {
    templateId: PortType.String,
    matchValue: PortType.String,
    matchColumnId: PortType.String,
    accessToken: PortType.String,
    workspaceId: PortType.String,
  },
  outputSchema: {
    eventContainerId: PortType.String,
    container: PortType.Object,
  },
  resolveOptionalInputPorts() {
    return ['matchColumnId', 'accessToken', 'workspaceId']
  },
  execute: async ({ configuration, input }) => {
    const templateId = String(input.templateId ?? '').trim()
    const matchValue = String(input.matchValue ?? '').trim()
    if (!templateId) throw new Error('Find Event Container: templateId input is required')
    if (!matchValue) throw new Error('Find Event Container: matchValue input is required')

    const matchColumnId = resolveMatchColumnId(configuration, input)
    const containers = await findEventContainers(
      { templateId, matchColumnId, matchValue, limit: 1 },
      resolveAuth(input),
    )
    const container = containers[0]
    if (!container) {
      return { eventContainerId: '', container: {} }
    }

    return {
      eventContainerId: container.id,
      container: container as unknown as Record<string, unknown>,
    }
  },
}
