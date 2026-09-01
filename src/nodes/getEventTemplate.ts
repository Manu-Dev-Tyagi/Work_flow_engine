import { NodeType, PortType } from '../engine/graph/enums'
import type { NodeDefinition } from '../engine/registry/types'
import {
  assertRequiredColumnValues,
  augmentColumnValuesFromContainer,
  buildColumnPortKey,
  buildColumnValuesFromInput,
  columnPortType,
  getPhysicalColumns,
  normalizeContainerTemplate,
  parseCachedTemplate,
} from '../integrations/vesta/columns'
import { fetchEventTemplates, findTemplateById } from '../integrations/vesta/eventTemplatesApi'
import { resolvePlutoAuth, type PlutoAuth } from '../integrations/vesta/plutoClient'
import type { OttopilotEventTemplate } from '../integrations/vesta/types'

type Config = {
  templateId: string
  templateDisplayName: string
  cachedTemplate: OttopilotEventTemplate | null
}

type Input = {
  accessToken?: string
  workspaceId?: string
} & Record<string, unknown>

type Output = {
  template: OttopilotEventTemplate
  templateId: string
  displayName: string
  revisionId: string
  eventContainerTemplateId: string
  defaultDisposition: string
  columnValues: Record<string, unknown>
}

const FIXED_OUTPUT_SCHEMA = {
  template: PortType.Object,
  templateId: PortType.String,
  displayName: PortType.String,
  revisionId: PortType.String,
  eventContainerTemplateId: PortType.String,
  defaultDisposition: PortType.String,
  columnValues: PortType.Object,
} as const

function resolveAuth(input: Input): PlutoAuth {
  return resolvePlutoAuth({
    workspaceId: input.workspaceId ? String(input.workspaceId) : undefined,
    accessToken: input.accessToken ? String(input.accessToken) : undefined,
  })
}

function buildDynamicInputSchema(configuration: Config): Record<string, PortType> {
  const schema: Record<string, PortType> = {}
  for (const column of getPhysicalColumns(parseCachedTemplate(configuration.cachedTemplate))) {
    schema[buildColumnPortKey(column)] = columnPortType(column.type)
  }
  return schema
}

export const getEventTemplateDefinition: NodeDefinition<Config, Input, Output> = {
  type: NodeType.GetEventTemplate,
  label: 'Get Event Template',
  configurationSchema: {
    templateId: PortType.String,
    templateDisplayName: PortType.String,
    cachedTemplate: PortType.Object,
  },
  inputSchema: {
    accessToken: PortType.String,
    workspaceId: PortType.String,
    fields: PortType.Object,
    containerColumnValues: PortType.Object,
    containerTemplate: PortType.Object,
  },
  outputSchema: FIXED_OUTPUT_SCHEMA,
  resolvePorts(configuration) {
    return {
      inputSchema: {
        accessToken: PortType.String,
        workspaceId: PortType.String,
        fields: PortType.Object,
        containerColumnValues: PortType.Object,
        containerTemplate: PortType.Object,
        ...buildDynamicInputSchema(configuration),
      },
      outputSchema: { ...FIXED_OUTPUT_SCHEMA },
    }
  },
  resolveOptionalInputPorts(configuration) {
    const dynamic = getPhysicalColumns(parseCachedTemplate(configuration.cachedTemplate)).map((c) =>
      buildColumnPortKey(c),
    )
    return ['accessToken', 'workspaceId', 'fields', 'containerColumnValues', 'containerTemplate', ...dynamic]
  },
  execute: async ({ configuration, input }) => {
    const templateId = configuration.templateId?.trim()
    if (!templateId) {
      throw new Error('Get Event Template: select a template in node configuration')
    }

    const auth = resolveAuth(input)
    const template = findTemplateById(await fetchEventTemplates(auth), templateId)
    if (!template) {
      throw new Error(`Get Event Template: template ${templateId} not found in workspace`)
    }

    const columnValues = augmentColumnValuesFromContainer(
      template,
      normalizeContainerTemplate(input.containerTemplate),
      input.containerColumnValues && typeof input.containerColumnValues === 'object'
        ? (input.containerColumnValues as Record<string, unknown>)
        : null,
      buildColumnValuesFromInput(template, input),
    )
    assertRequiredColumnValues(template, columnValues, 'Get Event Template')

    return {
      template,
      templateId: template.id,
      displayName: template.displayName,
      revisionId: template.revisionId,
      eventContainerTemplateId: template.eventContainerTemplateId,
      defaultDisposition:
        template.configuration.defaultDisposition ??
        template.configuration.dispositions?.[0]?.id ??
        '',
      columnValues,
    }
  },
}
