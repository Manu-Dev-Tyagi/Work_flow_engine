import { plutoPaths } from './config'
import { type PlutoAuth, plutoPost } from './plutoClient'
import { unwrapVestaResponse } from './unwrapResponse'

export type CreateEventRequest = {
  templateId: string
  eventContainerId: string
  columnValues: Record<string, unknown>
  disposition?: string
}

export async function createEvent(
  request: CreateEventRequest,
  authOverrides?: Partial<PlutoAuth>,
): Promise<string> {
  const data: Record<string, unknown> = {
    event_container_id: request.eventContainerId,
    additionalColumnValues: request.columnValues,
  }
  if (request.disposition?.trim()) {
    data.disposition = request.disposition.trim()
  }

  const response = await plutoPost(
    plutoPaths.eventsCreate,
    {
      templateId: request.templateId,
      data,
    },
    authOverrides,
  )

  if (!response.ok) {
    const text = await response.text().catch(() => '')
    throw new Error(
      `Failed to create event: ${response.status} ${response.statusText}${text ? ` — ${text}` : ''}`,
    )
  }

  const payload = (await response.json()) as unknown
  const eventId = unwrapVestaResponse<string>(payload)
  if (typeof eventId !== 'string' || !eventId.trim()) {
    throw new Error('Create event API did not return an event id')
  }
  return eventId
}
