import { NodeType, PortType } from '../engine/graph/enums'
import type { NodeDefinition } from '../engine/registry/types'
import {
  assertRequiredColumnValues,
  buildColumnPortKey,
  buildColumnValuesFromInput,
  columnPortType,
  getPhysicalColumns,
  parseCachedContainerTemplate,
} from '../integrations/vesta/columns'
import {
  fetchEventContainerTemplates,
  findContainerTemplateById,
} from '../integrations/vesta/eventContainerTemplatesApi'
import { resolvePlutoAuth, type PlutoAuth } from '../integrations/vesta/plutoClient'
import type { OttopilotEventContainerTemplate } from '../integrations/vesta/types'

type Config = {
  templateId: string
  templateDisplayName: string
  cachedContainerTemplate: OttopilotEventContainerTemplate | null
}

type Input = {
  accessToken?: string
  workspaceId?: string
} & Record<string, unknown>

type Output = {
  template: OttopilotEventContainerTemplate
  templateId: string
  displayName: string
  columnValues: Record<string, unknown>
}

const FIXED_OUTPUT_SCHEMA = {
  template: PortType.Object,
  templateId: PortType.String,
  displayName: PortType.String,
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
  for (const column of getPhysicalColumns(
    parseCachedContainerTemplate(configuration.cachedContainerTemplate),
  )) {
    schema[buildColumnPortKey(column)] = columnPortType(column.type)
  }
  return schema
}

export const getEventContainerTemplateDefinition: NodeDefinition<Config, Input, Output> = {
  type: NodeType.GetEventContainerTemplate,
  label: 'Get Event Container Template',
  configurationSchema: {
    templateId: PortType.String,
    templateDisplayName: PortType.String,
    cachedContainerTemplate: PortType.Object,
  },
  inputSchema: {
    accessToken: PortType.String,
    workspaceId: PortType.String,
    fields: PortType.Object,
  },
  outputSchema: FIXED_OUTPUT_SCHEMA,
  resolvePorts(configuration) {
    return {
      inputSchema: {
        accessToken: PortType.String,
        workspaceId: PortType.String,
        fields: PortType.Object,
        ...buildDynamicInputSchema(configuration),
      },
      outputSchema: { ...FIXED_OUTPUT_SCHEMA },
    }
  },
  resolveOptionalInputPorts(configuration) {
    const dynamic = getPhysicalColumns(
      parseCachedContainerTemplate(configuration.cachedContainerTemplate),
    ).map((column) => buildColumnPortKey(column))
    return ['accessToken', 'workspaceId', 'fields', ...dynamic]
  },
  execute: async ({ configuration, input }) => {
    const templateId = configuration.templateId?.trim()
    if (!templateId) {
      throw new Error('Get Event Container Template: select a template in node configuration')
    }

    const auth = resolveAuth(input)
    const template = findContainerTemplateById(
      await fetchEventContainerTemplates(auth),
      templateId,
    )
    if (!template) {
      throw new Error(
        `Get Event Container Template: template ${templateId} not found in workspace`,
      )
    }

    const columnValues = buildColumnValuesFromInput(template, input)
    assertRequiredColumnValues(template, columnValues, 'Get Event Container Template')

    return {
      template,
      templateId: template.id,
      displayName: template.displayName,
      columnValues,
    }
  },
}
