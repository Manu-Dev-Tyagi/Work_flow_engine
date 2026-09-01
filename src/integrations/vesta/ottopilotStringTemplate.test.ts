import { describe, expect, it } from 'vitest'
import { processOttopilotStringTemplate } from './ottopilotStringTemplate'

const DIRECT_VALUE = '👉fcb46858-4d6e-4afe-bc11-3cd88c580335👆'

describe('processOttopilotStringTemplate', () => {
  it('substitutes column UUID placeholders with values', () => {
    const template = `${DIRECT_VALUE}col-pincode👈 - ${DIRECT_VALUE}col-city👈`
    expect(
      processOttopilotStringTemplate(template, {
        'col-pincode': '560001',
        'col-city': 'Bangalore',
      }),
    ).toBe('560001 - Bangalore')
  })

  it('strips unresolved placeholders', () => {
    const template = `${DIRECT_VALUE}missing-col👈`
    expect(processOttopilotStringTemplate(template, {})).toBe('')
  })
})
