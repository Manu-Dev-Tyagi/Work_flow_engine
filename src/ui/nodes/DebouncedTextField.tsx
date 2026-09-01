import { useRef, useState } from 'react'
import TextField from '@atlaskit/textfield'

const COMMIT_MS = 250

type Props = {
  name: string
  committedValue: string
  type?: 'text' | 'number' | 'password'
  placeholder?: string
  onCommit: (value: string) => void
  onDraftChange?: (value: string) => void
}

export function DebouncedTextField({
  name,
  committedValue,
  type = 'text',
  placeholder,
  onCommit,
  onDraftChange,
}: Props) {
  const [draft, setDraft] = useState(committedValue)
  const [seenCommitted, setSeenCommitted] = useState(committedValue)
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  if (committedValue !== seenCommitted) {
    setSeenCommitted(committedValue)
    if (draft === seenCommitted) {
      setDraft(committedValue)
    }
  }

  const commit = (raw: string) => {
    if (raw === committedValue) return
    onCommit(raw)
  }

  return (
    <TextField
      name={name}
      isCompact
      type={type}
      placeholder={placeholder}
      value={draft}
      onChange={(event) => {
        const raw = event.currentTarget.value
        setDraft(raw)
        onDraftChange?.(raw)
        if (timerRef.current !== undefined) {
          clearTimeout(timerRef.current)
        }
        timerRef.current = setTimeout(() => {
          timerRef.current = undefined
          commit(raw)
        }, COMMIT_MS)
      }}
      onBlur={() => {
        if (timerRef.current !== undefined) {
          clearTimeout(timerRef.current)
          timerRef.current = undefined
        }
        commit(draft)
      }}
    />
  )
}
