import { describe, expect, it } from 'vitest'
import { switchEmptyDefinition } from './switchEmpty'

describe('switchEmpty execute', () => {
  it('routes empty container ids to whenNotFound', () => {
    expect(
      switchEmptyDefinition.execute({ configuration: {}, input: { containerId: '' } }),
    ).toEqual({
      whenNotFound: '',
    })
    expect(
      switchEmptyDefinition.execute({ configuration: {}, input: { containerId: '  ' } }),
    ).toEqual({
      whenNotFound: '  ',
    })
  })

  it('routes matched container ids to whenFound', () => {
    expect(
      switchEmptyDefinition.execute({
        configuration: {},
        input: { containerId: 'journey-uuid-1' },
      }),
    ).toEqual({
      whenFound: 'journey-uuid-1',
    })
  })
})
