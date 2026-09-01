import { PortType } from '../../engine/graph/enums'
import type {
  OttopilotEventTemplate,
  OttopilotEventContainerTemplate,
  OttopilotEventTemplateAdditionalColumn,
  OttopilotEventTemplateColumnSource,
} from './types'
import { PhysicalColumnSourceType, ResolverColumnSourceType } from './types'

/** Vesta OttopilotEventTemplateAdditionalColumnType UUIDs → engine PortType */
const COLUMN_TYPE_TO_PORT: Record<string, PortType> = {
  '5b3314a7-31a6-4cc1-8642-6a4cfb2f03a1': PortType.String, // text
  '8c98683a-e056-42a4-8c19-c5a70a1353cc': PortType.String, // email
  '576252a9-acc7-4379-b113-15adbffd3e69': PortType.String, // indianPhoneNumber
  '1f041a95-0735-4829-af0c-ee82caa5312b': PortType.String, // timestamp
  'e010f1f3-3ae3-4e48-96e8-3dfba6b217c9': PortType.String, // select (uuid)
  '3157a842-a2c0-4f2a-83ff-654dd4c76c9c': PortType.String, // user
  '133eb0fc-9125-4873-9bc8-30184efff8fa': PortType.String, // ou
  '46432b80-21a7-4579-8689-52f38aeab61e': PortType.String, // product
  'b1ff7949-036f-426a-be81-3a33ca4536f1': PortType.String, // role
  'eeb6995c-af50-4898-9981-5d5708b59830': PortType.String, // uuid
  '27eaed57-c99b-4220-9973-eefeb98573dd': PortType.String, // btlActivity
  'd41cfed6-8c18-47d1-b833-34d3aabf784b': PortType.Number, // geographyLatitude
  'efc8b90b-b3f8-470a-b132-f0ee464379f1': PortType.Number, // geographyLongitude
  'ad993ed8-a314-42de-b295-0b9db1028d70': PortType.String, // geographyCountries
  '7878dd63-d5f3-4389-b0e8-3606fe85784d': PortType.String, // geographyIndiaCities
  '90d2591e-2b24-4f5d-a665-e85c459f9ea4': PortType.String, // geographyIndiaPincodes
  '90aa909f-ab40-490a-b27b-df7d0c0c16cc': PortType.String, // geographyIndiaStates
  '7d424b72-d276-45b7-b977-48d27e0cd507': PortType.String, // geographyIndiaZones
}

export function toPortName(displayName: string): string {
  const words = displayName
    .trim()
    .replace(/[^a-zA-Z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
  if (words.length === 0) return 'column'
  const [first, ...rest] = words
  return (
    first.toLowerCase() +
    rest.map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('')
  )
}

export function isResolverColumn(column: OttopilotEventTemplateAdditionalColumn): boolean {
  const source = normalizeColumnSource(column.source)
  return source?.type === ResolverColumnSourceType
}

function normalizeColumnSource(
  source: unknown,
): OttopilotEventTemplateColumnSource | undefined {
  if (!source) return undefined
  if (typeof source === 'string') {
    if (source === ResolverColumnSourceType) {
      return { type: ResolverColumnSourceType, sql: '' }
    }
    return { type: PhysicalColumnSourceType, required: false, unique: false }
  }
  if (typeof source === 'object' && source !== null && 'type' in source) {
    return source as OttopilotEventTemplateColumnSource
  }
  return undefined
}

export function normalizeAdditionalColumn(
  value: unknown,
): OttopilotEventTemplateAdditionalColumn | null {
  if (!value || typeof value !== 'object') return null
  const column = value as Record<string, unknown>
  if (typeof column.id !== 'string' || typeof column.displayName !== 'string') return null
  const type = typeof column.type === 'string' ? column.type : ''
  const source = normalizeColumnSource(column.source)
  return {
    id: column.id,
    displayName: column.displayName,
    type,
    ...(source ? { source } : {}),
  }
}

export function normalizeAdditionalColumns(value: unknown): OttopilotEventTemplateAdditionalColumn[] {
  if (!Array.isArray(value)) return []
  return value
    .map((column) => normalizeAdditionalColumn(column))
    .filter((column): column is OttopilotEventTemplateAdditionalColumn => column !== null)
}

export function normalizeContainerTemplate(value: unknown): OttopilotEventContainerTemplate | null {
  if (!value || typeof value !== 'object') return null
  const template = value as Record<string, unknown>
  if (typeof template.id !== 'string') return null
  const rawColumns =
    template.additionalColumns ?? template.columns ?? template.fields ?? template.schema
  return {
    id: template.id,
    displayName: typeof template.displayName === 'string' ? template.displayName : '',
    additionalColumns: normalizeAdditionalColumns(rawColumns),
  }
}

export function isPhysicalColumn(
  column: OttopilotEventTemplateAdditionalColumn,
): boolean {
  return !isResolverColumn(column)
}

export function getPhysicalColumns(
  template: { additionalColumns: OttopilotEventTemplateAdditionalColumn[] } | null | undefined,
): OttopilotEventTemplateAdditionalColumn[] {
  if (!template) return []
  return template.additionalColumns.filter(isPhysicalColumn)
}

export function columnPortType(columnType: string): PortType {
  return COLUMN_TYPE_TO_PORT[columnType] ?? PortType.String
}

export function buildColumnPortKey(column: OttopilotEventTemplateAdditionalColumn): string {
  return toPortName(column.displayName)
}

function readFieldValue(
  fields: Record<string, unknown> | null,
  portKey: string,
): unknown {
  if (!fields || !(portKey in fields)) return undefined
  const value = fields[portKey]
  if (value === undefined || value === null) return undefined
  if (typeof value === 'string' && value.trim() === '') return undefined
  return value
}

/** Maps wired column ports and/or a `fields` object (camelCase keys) to column UUID values. */
export function buildColumnValuesFromInput(
  template: { additionalColumns: OttopilotEventTemplateAdditionalColumn[] } | null | undefined,
  input: Record<string, unknown>,
): Record<string, unknown> {
  const fields =
    input.fields !== null &&
    input.fields !== undefined &&
    typeof input.fields === 'object' &&
    !Array.isArray(input.fields)
      ? (input.fields as Record<string, unknown>)
      : null

  const columnValues: Record<string, unknown> = {}
  for (const column of getPhysicalColumns(template)) {
    const portKey = buildColumnPortKey(column)
    if (portKey in input && input[portKey] !== undefined) {
      columnValues[column.id] = input[portKey]
      continue
    }
    const fromFields = readFieldValue(fields, portKey)
    if (fromFields !== undefined) {
      columnValues[column.id] = fromFields
    }
  }
  return columnValues
}

/** Copies container column values onto event columns with the same displayName. */
export function augmentColumnValuesFromContainer(
  eventTemplate: { additionalColumns: OttopilotEventTemplateAdditionalColumn[] } | null | undefined,
  containerTemplate: { additionalColumns: OttopilotEventTemplateAdditionalColumn[] } | null | undefined,
  containerColumnValues: Record<string, unknown> | null | undefined,
  columnValues: Record<string, unknown>,
): Record<string, unknown> {
  if (!eventTemplate || !containerTemplate || !containerColumnValues) {
    return columnValues
  }

  const result = { ...columnValues }
  const containerColumns = getPhysicalColumns(containerTemplate)
  const containerByDisplayName = new Map(
    containerColumns.map((column) => [column.displayName.trim().toLowerCase(), column]),
  )

  for (const eventColumn of getPhysicalColumns(eventTemplate)) {
    if (result[eventColumn.id] !== undefined) continue
    const containerColumn = containerByDisplayName.get(eventColumn.displayName.trim().toLowerCase())
    if (!containerColumn) continue
    const value = containerColumnValues[containerColumn.id]
    if (value !== undefined && value !== null && !(typeof value === 'string' && value.trim() === '')) {
      result[eventColumn.id] = value
    }
  }

  return result
}

export function resolveColumnIdByDisplayName(
  template: { additionalColumns: OttopilotEventTemplateAdditionalColumn[] } | null | undefined,
  displayName: string,
): string {
  const target = displayName.trim()
  if (!template || !target) return ''

  const physical = getPhysicalColumns(template)
  const exact = physical.find((column) => column.displayName.trim() === target)
  if (exact) return exact.id

  const normalizedTarget = target.toLowerCase()
  const caseInsensitive = physical.find(
    (column) => column.displayName.trim().toLowerCase() === normalizedTarget,
  )
  if (caseInsensitive) return caseInsensitive.id

  const portMatch = physical.find((column) => toPortName(column.displayName) === toPortName(target))
  return portMatch?.id ?? ''
}

export function parseCachedTemplate(
  value: unknown,
): OttopilotEventTemplate | null {
  if (!value || typeof value !== 'object') return null
  const t = value as OttopilotEventTemplate
  if (typeof t.id !== 'string' || !Array.isArray(t.additionalColumns)) return null
  return t
}

export function parseCachedContainerTemplate(
  value: unknown,
): OttopilotEventContainerTemplate | null {
  return normalizeContainerTemplate(value)
}

function isRequiredPhysicalColumn(column: OttopilotEventTemplateAdditionalColumn): boolean {
  const source = normalizeColumnSource(column.source)
  return source?.type === PhysicalColumnSourceType && source.required === true
}

function hasColumnValue(columnValues: Record<string, unknown>, columnId: string): boolean {
  const value = columnValues[columnId]
  if (value === undefined || value === null) return false
  if (typeof value === 'string' && value.trim() === '') return false
  return true
}

/** Physical columns marked required in template metadata with no value in columnValues. */
export function getMissingRequiredColumnValues(
  template: { additionalColumns: OttopilotEventTemplateAdditionalColumn[] } | null | undefined,
  columnValues: Record<string, unknown>,
): string[] {
  const missing: string[] = []
  for (const column of getPhysicalColumns(template)) {
    if (!isRequiredPhysicalColumn(column)) continue
    if (!hasColumnValue(columnValues, column.id)) {
      missing.push(column.displayName)
    }
  }
  return missing
}

export function assertRequiredColumnValues(
  template: { additionalColumns: OttopilotEventTemplateAdditionalColumn[] } | null | undefined,
  columnValues: Record<string, unknown>,
  context: string,
): void {
  const missing = getMissingRequiredColumnValues(template, columnValues)
  if (missing.length === 0) return
  throw new Error(
    `${context}: missing required column value(s): ${missing.join(', ')}. Add camelCase keys to the trigger JSON (e.g. enquiryStatus) or wire column inputs.`,
  )
}

/** Summarize columnValues for error messages (display names when template is known). */
export function summarizeColumnValues(
  template: { additionalColumns: OttopilotEventTemplateAdditionalColumn[] } | null | undefined,
  columnValues: Record<string, unknown>,
): string {
  if (!template) {
    return `${Object.keys(columnValues).length} column(s): ${Object.keys(columnValues).join(', ')}`
  }
  const byId = new Map(getPhysicalColumns(template).map((column) => [column.id, column.displayName]))
  const parts = Object.entries(columnValues).map(([id, value]) => {
    const label = byId.get(id) ?? id
    const preview =
      typeof value === 'string' && value.length > 40 ? `${value.slice(0, 40)}…` : String(value)
    return `${label}=${preview}`
  })
  return parts.length > 0 ? parts.join('; ') : '(empty)'
}

export function readContainerAdditionalColumnValues(
  container: unknown,
): Record<string, unknown> | null {
  if (!container || typeof container !== 'object') return null
  const values = (container as Record<string, unknown>).additionalColumnValues
  if (!values || typeof values !== 'object' || Array.isArray(values)) return null
  return values as Record<string, unknown>
}

export function readContainerId(container: unknown): string | null {
  if (!container || typeof container !== 'object') return null
  const id = (container as Record<string, unknown>).id
  if (typeof id !== 'string' || !id.trim()) return null
  return id.trim()
}

/** Applies camelCase field overrides onto columnValues (by displayName port key). */
export function applyPortKeyOverridesToColumnValues(
  template: { additionalColumns: OttopilotEventTemplateAdditionalColumn[] } | null | undefined,
  columnValues: Record<string, unknown>,
  overrides: Record<string, unknown> | null | undefined,
): Record<string, unknown> {
  if (!template || !overrides) return columnValues
  const result = { ...columnValues }
  for (const column of getPhysicalColumns(template)) {
    const portKey = buildColumnPortKey(column)
    if (!(portKey in overrides)) continue
    const value = overrides[portKey]
    if (value === undefined || value === null) continue
    if (typeof value === 'string' && value.trim() === '') continue
    result[column.id] = value
  }
  return result
}
