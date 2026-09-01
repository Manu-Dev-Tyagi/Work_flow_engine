import type { OttopilotApiContext, OttopilotEventTemplate } from './types'
import { unwrapVestaResponse } from './unwrapResponse'

const PLUTO_EVENT_TEMPLATES_PATH = '/sub-system/pluto/ottopilot/event-templates/get'

function shouldProxyThroughApp(baseUrl: string): boolean {
  const trimmed = baseUrl.trim().toLowerCase()
  return !trimmed || trimmed.includes('intellsys.ai')
}

/**
 * Browser always calls same-origin `/api/event-templates`.
 * Vite proxies that locally; Vercel serves api/event-templates.ts.
 */
export function buildPlutoUrl(baseUrl: string, path: string): string {
  if (shouldProxyThroughApp(baseUrl)) return '/api/event-templates'
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
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
