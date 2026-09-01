import type { OttopilotApiContext, OttopilotEventTemplate } from './types'
import { unwrapVestaResponse } from './unwrapResponse'

const PLUTO_EVENT_TEMPLATES_PATH = '/sub-system/pluto/ottopilot/event-templates/get'

function shouldProxyThroughApp(baseUrl: string): boolean {
  const trimmed = baseUrl.trim().toLowerCase()
  return !trimmed || trimmed.includes('intellsys.ai')
}

/**
 * Browser calls same-origin `/sub-system/...`.
 * Vite proxies that locally; Vercel proxies it via /api/sub-system.
 */
export function buildPlutoUrl(baseUrl: string, path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  if (shouldProxyThroughApp(baseUrl)) return normalizedPath
  const trimmed = baseUrl.trim().replace(/\/+$/, '')
  return `${trimmed}${normalizedPath}`
}

export async function fetchEventTemplates(
  ctx: OttopilotApiContext,
): Promise<OttopilotEventTemplate[]> {
  const url = buildPlutoUrl(ctx.baseUrl, PLUTO_EVENT_TEMPLATES_PATH)
  let response: Response
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${ctx.accessToken}`,
        'Content-Type': 'application/json',
        'X-Workspace-Id': ctx.workspaceId,
      },
      body: JSON.stringify({}),
    })
  } catch {
    throw new Error(
      'Could not reach the Vesta API from the browser. Leave Base URL empty (or use https://dev.intellsys.ai) so the request goes through the app proxy.',
    )
  }

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
