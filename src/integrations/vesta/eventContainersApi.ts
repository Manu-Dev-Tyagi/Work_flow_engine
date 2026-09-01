import { plutoPaths } from './config'
import { buildEqualsFilter } from './filters'
import { type PlutoAuth, plutoPost } from './plutoClient'
import type { OttopilotEventContainer } from './types'
import { unwrapVestaResponse } from './unwrapResponse'

export type FindEventContainersQuery = {
  templateId: string
  matchColumnId: string
  matchValue: string
  limit?: number
}

export async function findEventContainers(
  query: FindEventContainersQuery,
  authOverrides?: Partial<PlutoAuth>,
): Promise<OttopilotEventContainer[]> {
  const response = await plutoPost(
    plutoPaths.eventContainersGetAll,
    {
      templateId: query.templateId,
      filters: buildEqualsFilter(query.matchColumnId, query.matchValue),
      limit: query.limit ?? 1,
      offset: 0,
    },
    authOverrides,
  )

  if (!response.ok) {
    const text = await response.text().catch(() => '')
    throw new Error(
      `Failed to find event containers: ${response.status} ${response.statusText}${text ? ` — ${text}` : ''}`,
    )
  }

  const payload = (await response.json()) as unknown
  const data = unwrapVestaResponse<unknown>(payload)
  if (!Array.isArray(data)) {
    throw new Error('Find event containers API returned a non-array response')
  }
  return data as OttopilotEventContainer[]
}

export type CreateEventContainerRequest = {
  templateId: string
  columnValues: Record<string, unknown>
  disposition?: string
  organizationalUnitId?: string
}

export async function createEventContainer(
  request: CreateEventContainerRequest,
  authOverrides?: Partial<PlutoAuth>,
): Promise<string> {
  const data: Record<string, unknown> = {
    additionalColumnValues: request.columnValues,
  }
  if (request.disposition?.trim()) {
    data.disposition = request.disposition.trim()
  }
  if (request.organizationalUnitId?.trim()) {
    data.ou_id = request.organizationalUnitId.trim()
  }

  const response = await plutoPost(
    plutoPaths.eventContainersCreate,
    {
      templateId: request.templateId,
      data,
    },
    authOverrides,
  )

  if (!response.ok) {
    const text = await response.text().catch(() => '')
    throw new Error(
      `Failed to create event container: ${response.status} ${response.statusText}${text ? ` — ${text}` : ''}`,
    )
  }

  const payload = (await response.json()) as unknown
  const eventContainerId = unwrapVestaResponse<string>(payload)
  if (typeof eventContainerId !== 'string' || !eventContainerId.trim()) {
    throw new Error('Create event container API did not return an id')
  }
  return eventContainerId
}
