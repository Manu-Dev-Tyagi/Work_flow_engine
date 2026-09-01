import type { OttopilotApiContext, OttopilotEventTemplate } from './types'
import { unwrapVestaResponse } from './unwrapResponse'

const PLUTO_EVENT_TEMPLATES_PATH = '/sub-system/pluto/ottopilot/event-templates/get'

/** Empty baseUrl uses same-origin path (Vite dev proxy → dev.intellsys.ai). */
export function buildPlutoUrl(baseUrl: string, path: string): string {
  const trimmed = baseUrl.trim().replace(/\/+$/, '')
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  if (!trimmed) return normalizedPath
  return `${trimmed}${normalizedPath}`
}

export async function fetchEventTemplates(
  ctx: OttopilotApiContext,
): Promise<OttopilotEventTemplate[]> {
  const url = buildPlutoUrl(ctx.baseUrl, PLUTO_EVENT_TEMPLATES_PATH)
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${ctx.accessToken}`,
      'Content-Type': 'application/json',
      'X-Workspace-Id': ctx.workspaceId,
    },
    body: JSON.stringify({}),
  })

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
