/** Vesta/Fides JSON envelope: { success: true, data: T } | { success: false, error: ... } */

type VestaSuccess<T> = { success: true; data: T }
type VestaFailure = { success: false; error?: { message?: string } | string }

export function unwrapVestaResponse<T>(payload: unknown): T {
  if (payload === null || typeof payload !== 'object' || !('success' in payload)) {
    throw new Error('Invalid Vesta API response')
  }
  const envelope = payload as VestaSuccess<T> | VestaFailure
  if (envelope.success === true) {
    return envelope.data
  }
  const message =
    typeof envelope.error === 'string'
      ? envelope.error
      : envelope.error?.message ?? 'Vesta API request failed'
  throw new Error(message)
}
