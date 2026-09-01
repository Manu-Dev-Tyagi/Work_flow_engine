/** Vesta/Fides JSON envelope: { success: true, data: T } | { success: false, error: ... } */

type VestaSuccess<T> = { success: true; data: T }
type VestaFailure = {
  success: false
  error?: { message?: string; cause?: unknown } | string
}

const OPAQUE_PLUTO_ERROR_UUID = 'bf022779-c79c-475a-803d-d35b0380431d'

function isOpaquePlutoErrorUuid(message: string): boolean {
  return message.trim().toLowerCase() === OPAQUE_PLUTO_ERROR_UUID
}

export function formatPlutoOpaqueCreateError(context: string): string {
  return (
    `${context}: Pluto returned opaque error ${OPAQUE_PLUTO_ERROR_UUID}. ` +
    'The real cause is logged server-side only. Common causes: (1) missing NOT NULL enquiry column such as Enquiry Status or Contact Number, ' +
    '(2) no permission to create events on the found Journey (try a new contactNumber), ' +
    '(3) invalid disposition. Check Create Event node Input in Results for columnValues.'
  )
}

function readNestedErrorMessage(value: unknown, depth = 0): string | undefined {
  if (depth > 4 || value === null || value === undefined) return undefined
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) return undefined
    if (/^[0-9a-f-]{36}$/i.test(trimmed) && depth < 4) {
      return undefined
    }
    return trimmed
  }
  if (value instanceof Error) {
    return readNestedErrorMessage(value.message, depth + 1) ?? readNestedErrorMessage(value.cause, depth + 1)
  }
  if (typeof value === 'object') {
    const record = value as Record<string, unknown>
    return (
      readNestedErrorMessage(record.message, depth + 1) ??
      readNestedErrorMessage(record.cause, depth + 1) ??
      readNestedErrorMessage(record.error, depth + 1)
    )
  }
  return undefined
}

export function unwrapVestaResponse<T>(payload: unknown): T {
  if (payload === null || typeof payload !== 'object' || !('success' in payload)) {
    throw new Error('Invalid Vesta API response')
  }
  const envelope = payload as VestaSuccess<T> | VestaFailure
  if (envelope.success === true) {
    return envelope.data
  }
  const nested =
    readNestedErrorMessage(envelope.error) ??
    (typeof envelope.error === 'object' ? readNestedErrorMessage(envelope.error?.cause) : undefined)
  const rawMessage =
    typeof envelope.error === 'string'
      ? envelope.error
      : envelope.error?.message ?? 'Vesta API request failed'
  if (nested) {
    throw new Error(nested)
  }
  if (isOpaquePlutoErrorUuid(rawMessage)) {
    throw new Error(formatPlutoOpaqueCreateError('Vesta API request failed'))
  }
  throw new Error(rawMessage)
}
