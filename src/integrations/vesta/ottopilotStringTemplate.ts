import type { Uuid } from './types'

const OTTOPILOT_DIRECT_VALUE_TEMPLATE_OPERATION_ID = 'fcb46858-4d6e-4afe-bc11-3cd88c580335'
const unresolvedOttopilotDirectValueTemplateRegex =
  /👉fcb46858-4d6e-4afe-bc11-3cd88c580335👆.*?👈/gu

function valueToText(value: unknown): string {
  if (value === null || value === undefined) {
    return ''
  }
  if (typeof value === 'object') {
    return JSON.stringify(value)
  }
  if (typeof value === 'string') {
    return value
  }
  if (
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    typeof value === 'bigint' ||
    typeof value === 'symbol'
  ) {
    return String(value)
  }
  return ''
}

/** Resolves Neptune/Vesta instanceDisplayNameTemplate using column UUID placeholders. */
export function processOttopilotStringTemplate(
  templateString: string,
  templateVars: Record<Uuid, unknown>,
): string {
  let resolved = templateString
  for (const [key, value] of Object.entries(templateVars)) {
    const stringValue = valueToText(value)
    resolved = resolved.replaceAll(
      `👉${OTTOPILOT_DIRECT_VALUE_TEMPLATE_OPERATION_ID}👆${key}👈`,
      stringValue,
    )
  }
  return resolved.replace(unresolvedOttopilotDirectValueTemplateRegex, '')
}
