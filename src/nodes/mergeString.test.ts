import { describe, expect, it } from 'vitest'
import { mergeStringDefinition } from './mergeString'

describe('mergeString execute', () => {
  it('prefers existingId when both are present', () => {
    expect(
      mergeStringDefinition.execute({
        configuration: {},
        input: { existingId: 'found-id', createdId: 'new-id' },
      }),
    ).toEqual({ containerId: 'found-id' })
  })

  it('uses createdId when existingId is missing', () => {
    expect(
      mergeStringDefinition.execute({ configuration: {}, input: { createdId: 'new-id' } }),
    ).toEqual({
      containerId: 'new-id',
    })
  })

  it('throws when neither input is present', () => {
    expect(() => mergeStringDefinition.execute({ configuration: {}, input: {} })).toThrow(
      'Coalesce Container Id: wire existingId or createdId',
    )
  })
})
