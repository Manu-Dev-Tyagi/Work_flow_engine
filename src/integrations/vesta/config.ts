/** Same-origin prefix — Vite and Vercel forward to VESTA_BASE_URL. */
export const PLUTO_API_PREFIX = '/api/vesta' as const

export const plutoPaths = {
  eventTemplatesGet: '/ottopilot/event-templates/get',
  eventsCreate: '/ottopilot/events/create',
  eventContainersGetAll: '/ottopilot/event-containers/get-all',
  eventContainersCreate: '/ottopilot/event-containers/create',
  eventContainerTemplatesGet: '/ottopilot/event-container-templates/get',
  organizationalUnitsGetAll: '/organizational-units/get-all',
  organizationalUnitTemplatesGet: '/organizational-unit-templates/get',
} as const

function readEnv(key: string): string {
  return (import.meta.env[key] as string | undefined)?.trim() ?? ''
}

export function getVestaWorkspaceId(): string {
  return readEnv('VITE_VESTA_WORKSPACE_ID')
}

export function getVestaAccessToken(): string {
  return readEnv('VITE_VESTA_ACCESS_TOKEN')
}

export function getVestaOrganizationalUnitId(): string {
  return readEnv('VITE_VESTA_ORGANIZATIONAL_UNIT_ID')
}

export function buildPlutoUrl(plutoPath: string): string {
  const path = plutoPath.startsWith('/') ? plutoPath : `/${plutoPath}`
  return `${PLUTO_API_PREFIX}${path}`
}
