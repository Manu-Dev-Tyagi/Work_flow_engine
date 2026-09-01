import { buildPlutoUrl, getVestaAccessToken, getVestaWorkspaceId } from './config'

export type PlutoAuth = {
  workspaceId: string
  accessToken: string
}

export function resolvePlutoAuth(overrides?: Partial<PlutoAuth>): PlutoAuth {
  const workspaceId = overrides?.workspaceId?.trim() || getVestaWorkspaceId()
  const accessToken = overrides?.accessToken?.trim() || getVestaAccessToken()
  if (!workspaceId) {
    throw new Error('Vesta workspace ID is required (set VITE_VESTA_WORKSPACE_ID)')
  }
  if (!accessToken) {
    throw new Error('Vesta access token is required (set VITE_VESTA_ACCESS_TOKEN)')
  }
  return { workspaceId, accessToken }
}

export async function plutoPost(
  plutoPath: string,
  body: unknown,
  authOverrides?: Partial<PlutoAuth>,
): Promise<Response> {
  const auth = resolvePlutoAuth(authOverrides)
  const url = buildPlutoUrl(plutoPath)
  try {
    return await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${auth.accessToken}`,
        'Content-Type': 'application/json',
        'X-Workspace-Id': auth.workspaceId,
      },
      body: JSON.stringify(body),
    })
  } catch {
    throw new Error('Could not reach the Vesta API through the app proxy.')
  }
}

function base64UrlEncodeUtf8(value: string): string {
  const bytes = new TextEncoder().encode(value)
  let binary = ''
  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/u, '')
}

/** Pluto cacheable GET — query param `body` holds base64url-encoded JSON filters. */
export async function plutoCacheableGet(
  plutoPath: string,
  input: unknown,
  authOverrides?: Partial<PlutoAuth>,
): Promise<Response> {
  const auth = resolvePlutoAuth(authOverrides)
  const url = new URL(buildPlutoUrl(plutoPath), 'http://localhost')
  url.searchParams.set('body', base64UrlEncodeUtf8(JSON.stringify(input)))
  try {
    return await fetch(`${url.pathname}${url.search}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${auth.accessToken}`,
        'X-Workspace-Id': auth.workspaceId,
      },
    })
  } catch {
    throw new Error('Could not reach the Vesta API through the app proxy.')
  }
}
