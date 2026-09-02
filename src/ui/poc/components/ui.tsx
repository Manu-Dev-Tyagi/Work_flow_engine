import type { ReactNode } from 'react'
import { CATEGORY_CHIP, EXECUTION_STATUS_STYLES } from '../theme/tokens'

type StatusChipProps = {
  label: string
  tone: keyof typeof EXECUTION_STATUS_STYLES
}

export function StatusChip({ label, tone }: StatusChipProps) {
  return (
    <span
      className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${EXECUTION_STATUS_STYLES[tone]}`}
    >
      {label}
    </span>
  )
}

export function PanelSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="grid gap-2">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</h3>
      {children}
    </section>
  )
}

export function PaletteItemButton({
  glyph,
  category,
  label,
  description,
  onClick,
}: {
  glyph: string
  category: keyof typeof CATEGORY_CHIP
  label: string
  description: string
  onClick: () => void
}) {
  const chip = CATEGORY_CHIP[category]
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-full items-center gap-2.5 rounded-md border border-slate-200 bg-white px-3 py-2.5 text-left transition hover:border-slate-300 hover:shadow-sm"
    >
      <div
        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${chip.bg} text-sm font-medium text-white`}
      >
        {glyph}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-xs font-semibold text-slate-800">{label}</div>
        <div className="truncate text-[10.5px] text-slate-500">{description}</div>
      </div>
    </button>
  )
}
