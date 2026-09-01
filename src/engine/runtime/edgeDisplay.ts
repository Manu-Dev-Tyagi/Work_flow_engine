import { PortType } from '../graph/enums'
import type { NodeInstance } from '../graph/types'
import {
  getPhysicalColumns,
  parseCachedContainerTemplate,
  parseCachedTemplate,
} from '../../integrations/vesta/columns'
import type { OttopilotEventTemplateAdditionalColumn } from '../../integrations/vesta/types'

export type EdgeDisplayContext = {
  sourceNode: NodeInstance
  sourcePort: string
  portType: PortType
  value: unknown
  output: Record<string, unknown>
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function isUuid(value: string): boolean {
  return UUID_RE.test(value)
}

function shortenUuid(value: string): string {
  return isUuid(value) ? `${value.slice(0, 8)}…` : value
}

function objectDisplayName(value: unknown): string | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const name = (value as Record<string, unknown>).displayName
  return typeof name === 'string' && name.trim() ? name.trim() : null
}

function resolveDispositionLabel(template: unknown, dispositionId: string): string {
  if (!template || typeof template !== 'object') return shortenUuid(dispositionId)
  const config = (template as Record<string, unknown>).configuration
  if (!config || typeof config !== 'object') return shortenUuid(dispositionId)
  const dispositions = (config as Record<string, unknown>).dispositions
  if (!Array.isArray(dispositions)) return shortenUuid(dispositionId)
  const match = dispositions.find(
    (item) =>
      item &&
      typeof item === 'object' &&
      (item as { id?: string }).id === dispositionId,
  ) as { displayName?: string } | undefined
  return match?.displayName ?? shortenUuid(dispositionId)
}

function resolveColumnValueLabel(
  template: { additionalColumns: OttopilotEventTemplateAdditionalColumn[] } | null,
  columnId: string,
  value: unknown,
): string {
  if (value === null || value === undefined) return '—'
  if (typeof value === 'boolean' || typeof value === 'number') return String(value)
  if (typeof value !== 'string') return JSON.stringify(value)
  if (!template) return isUuid(value) ? shortenUuid(value) : value
  const column = getPhysicalColumns(template).find((entry) => entry.id === columnId)
  if (!column) return isUuid(value) ? shortenUuid(value) : value
  const option = column.configuration?.options?.find((entry) => entry.id === value)
  if (option?.displayName) return option.displayName
  return value.length > 32 ? shortenUuid(value) : value
}

function formatColumnValuesDisplay(
  template: unknown,
  columnValues: Record<string, unknown>,
): string {
  const parsed = parseCachedTemplate(template) ?? parseCachedContainerTemplate(template)
  const keys = Object.keys(columnValues)
  if (keys.length === 0) return '(empty)'
  if (!parsed) return `${keys.length} column(s)`

  const preview = keys.slice(0, 2).map((columnId) => {
    const column = getPhysicalColumns(parsed).find((entry) => entry.id === columnId)
    const label = column?.displayName ?? 'column'
    return `${label}=${resolveColumnValueLabel(parsed, columnId, columnValues[columnId])}`
  })
  const extra = keys.length - 2
  return extra > 0 ? `${preview.join(', ')} +${extra}` : preview.join(', ')
}

function formatObjectBody(value: Record<string, unknown>): string {
  const keys = Object.keys(value)
  if (keys.length === 0) return '{}'
  const preview = keys.slice(0, 3).join(', ')
  const extra = keys.length - 3
  return extra > 0 ? `{${preview}, +${extra}}` : `{${preview}}`
}

/** Human-readable edge payload for canvas labels (raw values stay in edgeValues). */
export function formatEdgeDisplayValue(ctx: EdgeDisplayContext): string {
  const { sourceNode, sourcePort, portType, value, output } = ctx
  const configuration = sourceNode.configuration

  if (value === undefined) return '—'
  if (value === null) return 'null'
  if (value === '') {
    if (sourcePort === 'eventContainerId') return '(not found)'
    return '(empty)'
  }

  if (portType === PortType.Object) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return String(value)
    }
    const record = value as Record<string, unknown>
    if (sourcePort === 'columnValues') {
      const template =
        output.template ?? configuration.cachedTemplate ?? configuration.cachedContainerTemplate
      return formatColumnValuesDisplay(template, record)
    }
    if (sourcePort === 'body' || sourcePort === 'object') {
      return formatObjectBody(record)
    }
    if (
      sourcePort === 'container' ||
      sourcePort === 'template' ||
      sourcePort === 'containerTemplate' ||
      sourcePort === 'eventTemplate'
    ) {
      return objectDisplayName(record) ?? 'record'
    }
    return '{object}'
  }

  if (portType === PortType.Number) {
    return String(value)
  }

  const str = String(value)

  switch (sourcePort) {
    case 'templateId':
      return (
        String(output.displayName ?? '').trim() ||
        String(configuration.templateDisplayName ?? '').trim() ||
        shortenUuid(str)
      )
    case 'displayName':
      return str
    case 'matchValue':
      return str
    case 'eventContainerId':
      return `Journey ${shortenUuid(str)}`
    case 'eventId':
      return `Event ${shortenUuid(str)}`
    case 'defaultDisposition':
    case 'disposition':
      return resolveDispositionLabel(
        output.template ?? configuration.cachedTemplate ?? configuration.cachedContainerTemplate,
        str,
      )
    case 'whenFound':
    case 'whenNotFound':
    case 'gate':
      return str
    default:
      if (isUuid(str)) return shortenUuid(str)
      return str.length > 48 ? `${str.slice(0, 45)}…` : str
  }
}
