import type { ReactNode } from 'react'

interface SectionProps {
  id: string
  index: number
  title: string
  subtitle?: string
  children: ReactNode
}

/**
 * Section — jednotný obal pre každú kapitolu scrollytellingu.
 * Poskytuje kotvu (id) pre navigáciu a konzistentné nadpisy.
 */
export function Section({ id, index, title, subtitle, children }: SectionProps) {
  return (
    <section id={id} className="mx-auto max-w-5xl px-5 py-14 md:py-20">
      <header className="mb-6">
        <div className="mb-2 flex items-center gap-3">
          <span className="font-mono text-sm font-semibold text-accent">
            {String(index).padStart(2, '0')}
          </span>
          <span className="h-px flex-1 bg-gradient-to-r from-accent/40 to-transparent" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-white md:text-3xl">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-2 max-w-2xl text-sm text-slate-400 md:text-base">
            {subtitle}
          </p>
        )}
      </header>
      <div className="space-y-6">{children}</div>
    </section>
  )
}

/** Krátky popisok / legenda pod vizualizáciou (mimo canvasu). */
export function Caption({ children }: { children: ReactNode }) {
  return (
    <p className="text-xs leading-relaxed text-slate-500">{children}</p>
  )
}

/** Legenda dátovej série (farebný bod + názov). */
export function LegendItem({ color, children }: { color: string; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-slate-400">
      <span className="legend-dot" style={{ backgroundColor: color }} />
      {children}
    </span>
  )
}
