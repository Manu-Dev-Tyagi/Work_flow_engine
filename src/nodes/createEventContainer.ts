import { NodeType, PortType } from '../engine/graph/enums'
import type { NodeDefinition } from '../engine/registry/types'
import { getVestaOrganizationalUnitId } from '../integrations/vesta/config'
import { createEventContainer } from '../integrations/vesta/eventContainersApi'
import { resolvePlutoAuth, type PlutoAuth } from '../integrations/vesta/plutoClient'

type Config = {
  organizationalUnitId: string
  organizationalUnitDisplayName: string
}

type Input = {
  templateId: string
  columnValues: Record<string, unknown>
  disposition?: string
  organizationalUnitId?: string
  gate?: string
  accessToken?: string
  workspaceId?: string
}

type Output = {
  eventContainerId: string
}

function resolveAuth(input: Input): PlutoAuth {
  return resolvePlutoAuth({
    workspaceId: input.workspaceId ? String(input.workspaceId) : undefined,
    accessToken: input.accessToken ? String(input.accessToken) : undefined,
  })
}

function resolveOrganizationalUnitId(configuration: Config, input: Input): string {
  const wired = String(input.organizationalUnitId ?? '').trim()
  if (wired) return wired

  const configured = String(configuration.organizationalUnitId ?? '').trim()
  if (configured) return configured

  const fromEnv = getVestaOrganizationalUnitId()
  if (fromEnv) return fromEnv

  throw new Error(
    'Create Event Container: organizationalUnitId is required (wire input, set config.organizationalUnitId, or VITE_VESTA_ORGANIZATIONAL_UNIT_ID in .env)',
  )
}

export const createEventContainerDefinition: NodeDefinition<Config, Input, Output> = {
  type: NodeType.CreateEventContainer,
  label: 'Create Event Container',
  configurationSchema: {
    organizationalUnitId: PortType.String,
    organizationalUnitDisplayName: PortType.String,
  },
  inputSchema: {
    templateId: PortType.String,
    columnValues: PortType.Object,
    disposition: PortType.String,
    organizationalUnitId: PortType.String,
    gate: PortType.String,
    accessToken: PortType.String,
    workspaceId: PortType.String,
  },
  outputSchema: {
    eventContainerId: PortType.String,
  },
  resolveOptionalInputPorts() {
    return ['disposition', 'organizationalUnitId', 'gate', 'accessToken', 'workspaceId']
  },
  resolveActivationInputPorts() {
    return ['gate']
  },
  execute: async ({ configuration, input }) => {
    const templateId = String(input.templateId ?? '').trim()
    if (!templateId) throw new Error('Create Event Container: templateId input is required')
    if (!input.columnValues || typeof input.columnValues !== 'object') {
      throw new Error('Create Event Container: columnValues input is required')
    }

    const eventContainerId = await createEventContainer(
      {
        templateId,
        columnValues: input.columnValues,
        disposition: input.disposition ? String(input.disposition) : undefined,
        organizationalUnitId: resolveOrganizationalUnitId(configuration, input),
      },
      resolveAuth(input),
    )

    return { eventContainerId }
  },
}
