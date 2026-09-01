import { plutoPaths } from './config'
import { plutoCacheableGet, type PlutoAuth } from './plutoClient'
import {
  OrganizationalUnitTemplateStatusActive,
  type OttopilotOrganizationalUnitTemplate,
} from './types'
import { unwrapVestaResponse } from './unwrapResponse'

export async function fetchOrganizationalUnitTemplates(
  authOverrides?: Partial<PlutoAuth>,
): Promise<OttopilotOrganizationalUnitTemplate[]> {
  const response = await plutoCacheableGet(
    plutoPaths.organizationalUnitTemplatesGet,
    {},
    authOverrides,
  )

  if (!response.ok) {
    const text = await response.text().catch(() => '')
    throw new Error(
      `Failed to fetch organizational unit templates: ${response.status} ${response.statusText}${text ? ` — ${text}` : ''}`,
    )
  }

  const payload = (await response.json()) as unknown
  const data = unwrapVestaResponse<unknown>(payload)
  if (!Array.isArray(data)) {
    throw new Error('Organizational unit templates API returned a non-array response')
  }

  return (data as OttopilotOrganizationalUnitTemplate[]).filter(
    (template) => template.status === OrganizationalUnitTemplateStatusActive,
  )
}
