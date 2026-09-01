import { plutoPaths } from './config'
import type { OttopilotEventTemplate } from './types'
import { unwrapVestaResponse } from './unwrapResponse'
import { type PlutoAuth, plutoPost } from './plutoClient'

export async function fetchEventTemplates(
  authOverrides?: Partial<PlutoAuth>,
): Promise<OttopilotEventTemplate[]> {
  const response = await plutoPost(plutoPaths.eventTemplatesGet, {}, authOverrides)

  if (!response.ok) {
    const text = await response.text().catch(() => '')
    throw new Error(
      `Failed to fetch event templates: ${response.status} ${response.statusText}${text ? ` — ${text}` : ''}`,
    )
  }

  const payload = (await response.json()) as unknown
  const data = unwrapVestaResponse<unknown>(payload)
  if (!Array.isArray(data)) {
    throw new Error('Event templates API returned a non-array response')
  }
  return data as OttopilotEventTemplate[]
}

export function findTemplateById(
  templates: OttopilotEventTemplate[],
  templateId: string,
): OttopilotEventTemplate | undefined {
  return templates.find((t) => t.id === templateId)
}
