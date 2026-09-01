import { NodeType, PortType } from '../engine/graph/enums'
import type { NodeDefinition } from '../engine/registry/types'
import {
  buildColumnPortKey,
  columnPortType,
  getPhysicalColumns,
  parseCachedTemplate,
} from '../integrations/vesta/columns'
import { fetchEventTemplates, findTemplateById } from '../integrations/vesta/eventTemplatesApi'
import type { OttopilotEventTemplate } from '../integrations/vesta/types'

type Config = {
  baseUrl: string
  workspaceId: string
  accessToken: string
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

function resolveAuth(
  configuration: Config,
  input: Input,
): { baseUrl: string; workspaceId: string; accessToken: string } {
  const workspaceId = (input.workspaceId ?? configuration.workspaceId)?.trim()
  const accessToken = (input.accessToken ?? configuration.accessToken)?.trim()
  if (!workspaceId) throw new Error('Get Event Template: workspaceId is required')
  if (!accessToken) throw new Error('Get Event Template: accessToken is required')
  return { baseUrl: configuration.baseUrl?.trim() ?? '', workspaceId, accessToken }
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
    baseUrl: PortType.String,
    workspaceId: PortType.String,
    accessToken: PortType.String,
    templateId: PortType.String,
    templateDisplayName: PortType.String,
    cachedTemplate: PortType.Object,
  },
  inputSchema: {
    accessToken: PortType.String,
    workspaceId: PortType.String,
  },
  outputSchema: FIXED_OUTPUT_SCHEMA,
  resolvePorts(configuration) {
    return {
      inputSchema: {
        accessToken: PortType.String,
        workspaceId: PortType.String,
        ...buildDynamicInputSchema(configuration),
      },
      outputSchema: { ...FIXED_OUTPUT_SCHEMA },
    }
  },
  resolveOptionalInputPorts(configuration) {
    const dynamic = getPhysicalColumns(parseCachedTemplate(configuration.cachedTemplate)).map((c) =>
      buildColumnPortKey(c),
    )
    return ['accessToken', 'workspaceId', ...dynamic]
  },
  execute: async ({ configuration, input }) => {
    const templateId = configuration.templateId?.trim()
    if (!templateId) {
      throw new Error('Get Event Template: select a template in node configuration')
    }

    const auth = resolveAuth(configuration, input)
    const template = findTemplateById(await fetchEventTemplates(auth), templateId)
    if (!template) {
      throw new Error(`Get Event Template: template ${templateId} not found in workspace`)
    }

    const columnValues: Record<string, unknown> = {}
    for (const column of getPhysicalColumns(template)) {
      const portKey = buildColumnPortKey(column)
      if (portKey in input && input[portKey] !== undefined) {
        columnValues[column.id] = input[portKey]
      }
    }

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
