import type { ReactNode } from 'react'

/* ---------- Panel meracieho prístroja ---------- */

export function Panel({
  title,
  led = 'on',
  right,
  children,
  className = '',
}: {
  title: string
  led?: 'on' | 'busy' | 'off'
  right?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <div className={`panel ${className}`}>
      <div className="panel-head">
        <span className={`led led-${led}`} aria-hidden />
        <span className="flex-1">{title}</span>
        {right}
      </div>
      <div className="p-4">{children}</div>
    </div>
  )
}

/* ---------- Slider s viditeľnou hodnotou (v DOM, nie v canvase) ---------- */

export function Slider({
  label,
  value,
  min,
  max,
  step = 0.01,
  onChange,
  format,
  unit,
}: {
  label: string
  value: number
  min: number
  max: number
  step?: number
  onChange: (v: number) => void
  format?: (v: number) => string
  unit?: string
}) {
  return (
    <label className="block">
      <div className="mb-1.5 flex items-baseline justify-between gap-2">
        <span className="text-xs font-medium text-slate-400">{label}</span>
        <span className="font-mono text-xs tabular-nums text-accent-bright">
          {format ? format(value) : value.toFixed(2)}
          {unit ? ` ${unit}` : ''}
        </span>
      </div>
      <input
        type="range"
        className="w-full"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
      />
    </label>
  )
}

/* ---------- Sekcia scrollytellingu ---------- */

export function Section({
  id,
  index,
  title,
  lead,
  children,
}: {
  id: string
  index: number
  title: string
  lead?: string
  children: ReactNode
}) {
  return (
    <section id={id} className="mx-auto max-w-5xl px-4 py-12 md:px-6 md:py-16">
      <header className="mb-6">
        <div className="mb-2 flex items-center gap-3">
          <span className="font-mono text-xs font-bold tracking-widest text-accent">
            CH{String(index).padStart(2, '0')}
          </span>
          <span className="h-px flex-1 bg-gradient-to-r from-accent/50 to-transparent" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-white md:text-3xl">{title}</h2>
        {lead && <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-400 md:text-[15px]">{lead}</p>}
      </header>
      <div className="space-y-5">{children}</div>
    </section>
  )
}

/* ---------- Popisok a legenda (mimo canvasu) ---------- */

export function Caption({ children }: { children: ReactNode }) {
  return <p className="text-xs leading-relaxed text-slate-500">{children}</p>
}

export function Legend({ items }: { items: { color: string; label: ReactNode }[] }) {
  return (
    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
      {items.map((it, i) => (
        <span key={i} className="inline-flex items-center gap-1.5 text-xs text-slate-400">
          <span className="legend-dot" style={{ backgroundColor: it.color }} />
          {it.label}
        </span>
      ))}
    </div>
  )
}

/* ---------- Číselný displej prístroja ---------- */

export function Readout({
  label,
  value,
  unit,
  tone = 'phosphor',
}: {
  label: string
  value: string
  unit?: string
  tone?: 'phosphor' | 'accent' | 'muted' | 'cyan' | 'amber'
}) {
  const colors: Record<string, string> = {
    phosphor: '#2fce68',
    accent: '#ff7f45',
    muted: '#94a3b8',
    cyan: '#2cbdb7',
    amber: '#f0b429',
  }
  return (
    <div className="rounded border border-scope-600/60 bg-scope-900 px-3 py-2">
      <div className="text-[10px] uppercase tracking-widest text-slate-500">{label}</div>
      <div className="font-mono text-lg tabular-nums" style={{ color: colors[tone] }}>
        {value}
        {unit && <span className="ml-1 text-xs text-slate-500">{unit}</span>}
      </div>
    </div>
  )
}
