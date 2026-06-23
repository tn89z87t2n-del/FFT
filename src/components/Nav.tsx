import { useEffect, useState } from 'react'
import { SECTIONS } from '../sections'

/**
 * Nav — sticky bočná navigácia (desktop) / horný panel (mobil).
 * Zvýrazňuje aktuálnu sekciu pomocou IntersectionObserver (scroll spy).
 */
export function Nav() {
  const [active, setActive] = useState(SECTIONS[0].id)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(entry.target.id)
        }
      },
      { rootMargin: '-45% 0px -50% 0px', threshold: 0 },
    )
    for (const s of SECTIONS) {
      const el = document.getElementById(s.id)
      if (el) observer.observe(el)
    }
    return () => observer.disconnect()
  }, [])

  return (
    <>
      {/* Mobilný prepínač */}
      <button
        className="btn fixed right-4 top-4 z-50 md:hidden"
        onClick={() => setOpen((o) => !o)}
        aria-label="Prepnúť navigáciu"
      >
        {open ? '✕' : '☰'} Sekcie
      </button>

      <nav
        className={`fixed left-0 top-0 z-40 h-full w-60 border-r border-ink-600/60 bg-ink-850/95 p-4 backdrop-blur transition-transform md:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <a
          href="#intro"
          onClick={() => setOpen(false)}
          className="mb-5 block"
        >
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold tracking-tight text-white">FFT</span>
            <span className="h-2 w-2 animate-pulse rounded-full bg-accent shadow-glow" />
          </div>
          <div className="text-[11px] uppercase tracking-widest text-slate-500">
            interaktívne
          </div>
        </a>

        <ol className="space-y-0.5 text-sm">
          {SECTIONS.map((s, i) => (
            <li key={s.id}>
              <a
                href={`#${s.id}`}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-2 rounded-md px-2 py-1.5 transition-colors ${
                  active === s.id
                    ? 'bg-accent/15 text-white'
                    : 'text-slate-400 hover:bg-ink-700/60 hover:text-slate-200'
                }`}
              >
                <span
                  className={`font-mono text-[10px] ${
                    active === s.id ? 'text-accent' : 'text-slate-600'
                  }`}
                >
                  {String(i).padStart(2, '0')}
                </span>
                <span className="leading-tight">{s.short}</span>
              </a>
            </li>
          ))}
        </ol>
      </nav>

      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}
    </>
  )
}
