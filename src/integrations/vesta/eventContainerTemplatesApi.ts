import { normalizeContainerTemplate } from './columns'
import { plutoPaths } from './config'
import type { OttopilotEventContainerTemplate } from './types'
import { type PlutoAuth, plutoPost } from './plutoClient'
import { unwrapVestaResponse } from './unwrapResponse'

export async function fetchEventContainerTemplates(
  authOverrides?: Partial<PlutoAuth>,
): Promise<OttopilotEventContainerTemplate[]> {
  const response = await plutoPost(plutoPaths.eventContainerTemplatesGet, {}, authOverrides)

  if (!response.ok) {
    const text = await response.text().catch(() => '')
    throw new Error(
      `Failed to fetch event container templates: ${response.status} ${response.statusText}${text ? ` — ${text}` : ''}`,
    )
  }

  const payload = (await response.json()) as unknown
  const data = unwrapVestaResponse<unknown>(payload)
  if (!Array.isArray(data)) {
    throw new Error('Event container templates API returned a non-array response')
  }
  return data
    .map((item) => normalizeContainerTemplate(item))
    .filter((item): item is OttopilotEventContainerTemplate => item !== null)
}

export function findContainerTemplateById(
  templates: OttopilotEventContainerTemplate[],
  templateId: string,
): OttopilotEventContainerTemplate | undefined {
  return templates.find((t) => t.id === templateId)
}
