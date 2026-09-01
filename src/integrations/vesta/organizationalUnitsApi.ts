import { processOttopilotStringTemplate } from './ottopilotStringTemplate'
import { plutoPaths } from './config'
import { plutoCacheableGet, type PlutoAuth } from './plutoClient'
import { fetchOrganizationalUnitTemplates } from './organizationalUnitTemplatesApi'
import {
  OrganizationalUnitStatusActive,
  type OttopilotOrganizationalUnit,
  type OttopilotOrganizationalUnitTemplate,
} from './types'
import { unwrapVestaResponse } from './unwrapResponse'

const FULL_READ_INPUT = {
  complexFilters: { filters: [], logic: 'AND' as const },
  limit: 99999,
  offset: 0,
  orderBy: [] as unknown[],
}

export type OrganizationalUnitDirectory = {
  units: OttopilotOrganizationalUnit[]
  templates: OttopilotOrganizationalUnitTemplate[]
}

export function formatOrganizationalUnitLabel(
  unit: OttopilotOrganizationalUnit,
  templates: OttopilotOrganizationalUnitTemplate[] = [],
): string {
  const template = templates.find((candidate) => candidate.id === unit.templateId)
  if (template !== undefined) {
    const displayName = processOttopilotStringTemplate(
      template.instanceDisplayNameTemplate,
      unit.additionalColumnValues ?? {},
    ).trim()
    if (displayName) {
      return displayName
    }
  }

  for (const value of Object.values(unit.additionalColumnValues ?? {})) {
    if (typeof value === 'string' && value.trim()) {
      return value.trim()
    }
    if (typeof value === 'number' || typeof value === 'boolean') {
      return String(value)
    }
  }

  return unit.id.length > 8 ? `${unit.id.slice(0, 8)}…` : unit.id
}

export async function fetchOrganizationalUnits(
  authOverrides?: Partial<PlutoAuth>,
): Promise<OttopilotOrganizationalUnit[]> {
  const response = await plutoCacheableGet(
    plutoPaths.organizationalUnitsGetAll,
    FULL_READ_INPUT,
    authOverrides,
  )

  if (!response.ok) {
    const text = await response.text().catch(() => '')
    throw new Error(
      `Failed to fetch organizational units: ${response.status} ${response.statusText}${text ? ` — ${text}` : ''}`,
    )
  }

  const payload = (await response.json()) as unknown
  const data = unwrapVestaResponse<unknown>(payload)
  if (!Array.isArray(data)) {
    throw new Error('Organizational units API returned a non-array response')
  }

  return (data as OttopilotOrganizationalUnit[]).filter(
    (unit) => unit.status === OrganizationalUnitStatusActive,
  )
}

export async function fetchOrganizationalUnitDirectory(
  authOverrides?: Partial<PlutoAuth>,
): Promise<OrganizationalUnitDirectory> {
  const [units, templates] = await Promise.all([
    fetchOrganizationalUnits(authOverrides),
    fetchOrganizationalUnitTemplates(authOverrides),
  ])
  return { units, templates }
}
