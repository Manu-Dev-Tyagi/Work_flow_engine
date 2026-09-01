import { NodeType, PortType } from '../engine/graph/enums'
import type { NodeDefinition } from '../engine/registry/types'
import {
  applyPortKeyOverridesToColumnValues,
  assertRequiredColumnValues,
  augmentColumnValuesFromContainer,
  normalizeContainerTemplate,
  parseCachedTemplate,
  readContainerAdditionalColumnValues,
  readContainerId,
  summarizeColumnValues,
} from '../integrations/vesta/columns'
import { createEvent } from '../integrations/vesta/eventsApi'
import { formatPlutoOpaqueCreateError } from '../integrations/vesta/unwrapResponse'
import { resolvePlutoAuth, type PlutoAuth } from '../integrations/vesta/plutoClient'

type Config = {
  /** camelCase port keys applied when an existing container is wired (repeat-lead path). */
  existingContainerFieldOverrides?: Record<string, unknown>
}

type Input = {
  templateId: string
  eventContainerId: string
  columnValues: Record<string, unknown>
  disposition?: string
  eventTemplate?: unknown
  containerTemplate?: unknown
  container?: unknown
  accessToken?: string
  workspaceId?: string
}

type Output = {
  eventId: string
}

function resolveAuth(input: Input): PlutoAuth {
  return resolvePlutoAuth({
    workspaceId: input.workspaceId ? String(input.workspaceId) : undefined,
    accessToken: input.accessToken ? String(input.accessToken) : undefined,
  })
}

function resolveColumnValues(input: Input, configuration: Config): Record<string, unknown> {
  const base =
    input.columnValues && typeof input.columnValues === 'object'
      ? { ...input.columnValues }
      : null
  if (!base) {
    throw new Error('Create Event: columnValues input is required')
  }

  const eventTemplate = parseCachedTemplate(input.eventTemplate)
  const containerTemplate = normalizeContainerTemplate(input.containerTemplate)
  const containerColumnValues = readContainerAdditionalColumnValues(input.container)
  let columnValues = base
  if (eventTemplate && containerTemplate && containerColumnValues) {
    columnValues = augmentColumnValuesFromContainer(
      eventTemplate,
      containerTemplate,
      containerColumnValues,
      columnValues,
    )
  }

  if (readContainerId(input.container) && eventTemplate) {
    columnValues = applyPortKeyOverridesToColumnValues(
      eventTemplate,
      columnValues,
      configuration.existingContainerFieldOverrides,
    )
  }

  return columnValues
}

export const createEventDefinition: NodeDefinition<Config, Input, Output> = {
  type: NodeType.CreateEvent,
  label: 'Create Event',
  configurationSchema: {
    existingContainerFieldOverrides: PortType.Object,
  },
  inputSchema: {
    templateId: PortType.String,
    eventContainerId: PortType.String,
    columnValues: PortType.Object,
    disposition: PortType.String,
    eventTemplate: PortType.Object,
    containerTemplate: PortType.Object,
    container: PortType.Object,
    accessToken: PortType.String,
    workspaceId: PortType.String,
  },
  outputSchema: {
    eventId: PortType.String,
  },
  resolveOptionalInputPorts() {
    return [
      'disposition',
      'eventTemplate',
      'containerTemplate',
      'container',
      'accessToken',
      'workspaceId',
    ]
  },
  execute: async ({ configuration, input }) => {
    const templateId = String(input.templateId ?? '').trim()
    const eventContainerId = String(input.eventContainerId ?? '').trim()
    if (!templateId) throw new Error('Create Event: templateId input is required')
    if (!eventContainerId) throw new Error('Create Event: eventContainerId input is required')

    const eventTemplate = parseCachedTemplate(input.eventTemplate)
    const columnValues = resolveColumnValues(input, configuration)
    assertRequiredColumnValues(eventTemplate, columnValues, 'Create Event')

    const auth = resolveAuth(input)
    try {
      const eventId = await createEvent(
        {
          templateId,
          eventContainerId,
          columnValues,
          disposition: input.disposition ? String(input.disposition) : undefined,
        },
        auth,
      )
      return { eventId }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      const summary = summarizeColumnValues(eventTemplate, columnValues)
      if (message.includes('bf022779-c79c-475a-803d-d35b0380431d')) {
        throw new Error(
          `${formatPlutoOpaqueCreateError('Create Event')} eventContainerId=${eventContainerId}; columns: ${summary}`,
        )
      }
      throw new Error(
        `Create Event failed: ${message} (eventContainerId=${eventContainerId}; columns: ${summary})`,
      )
    }
  },
}
