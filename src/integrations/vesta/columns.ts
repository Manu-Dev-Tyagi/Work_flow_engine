import { PortType } from '../../engine/graph/enums'
import type { OttopilotEventTemplate, OttopilotEventTemplateAdditionalColumn } from './types'
import { PhysicalColumnSourceType } from './types'

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

export function isPhysicalColumn(
  column: OttopilotEventTemplateAdditionalColumn,
): column is OttopilotEventTemplateAdditionalColumn & {
  source: { type: typeof PhysicalColumnSourceType; required: boolean; unique: boolean }
} {
  return column.source.type === PhysicalColumnSourceType
}

export function getPhysicalColumns(
  template: OttopilotEventTemplate | null | undefined,
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

export function parseCachedTemplate(
  value: unknown,
): OttopilotEventTemplate | null {
  if (!value || typeof value !== 'object') return null
  const t = value as OttopilotEventTemplate
  if (typeof t.id !== 'string' || !Array.isArray(t.additionalColumns)) return null
  return t
}
