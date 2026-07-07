import { useEffect, useState } from 'react'
import { SECTIONS } from '../sections/meta'

/**
 * Sticky navigácia s progress indikátorom:
 * - horná tenká linka = % zoscrollovania celej stránky,
 * - scroll-spy zvýrazňuje aktívnu sekciu (IntersectionObserver).
 */
export function Nav() {
  const [active, setActive] = useState<string>(SECTIONS[0].id)
  const [progress, setProgress] = useState(0)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(e.target.id)
      },
      { rootMargin: '-40% 0px -55% 0px' },
    )
    for (const s of SECTIONS) {
      const el = document.getElementById(s.id)
      if (el) io.observe(el)
    }
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight
      setProgress(max > 0 ? window.scrollY / max : 0)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => {
      io.disconnect()
      window.removeEventListener('scroll', onScroll)
    }
  }, [])

  return (
    <>
      {/* progress linka navrchu */}
      <div className="fixed inset-x-0 top-0 z-50 h-0.5 bg-scope-800">
        <div
          className="h-full bg-gradient-to-r from-accent to-amberb transition-[width] duration-150"
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      <button
        className="btn fixed right-3 top-3 z-50 lg:hidden"
        onClick={() => setOpen((o) => !o)}
        aria-label="Prepnúť navigáciu"
      >
        {open ? '✕' : '☰'} Kapitoly
      </button>

      <nav
        className={`fixed left-0 top-0 z-40 h-full w-64 overflow-y-auto border-r border-scope-600/50 bg-scope-900/95 p-4 pt-6 backdrop-blur transition-transform lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <a href="#hook" onClick={() => setOpen(false)} className="mb-5 block">
          <div className="flex items-center gap-2">
            <span className="text-lg font-extrabold tracking-tight text-white">FFT LAB</span>
            <span className="led led-on animate-pulse" />
          </div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500">
            v2 · interaktívne
          </div>
        </a>

        <ol className="space-y-0.5 text-[13px]">
          {SECTIONS.map((s, i) => (
            <li key={s.id}>
              <a
                href={`#${s.id}`}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-2 rounded px-2 py-1.5 transition-colors ${
                  active === s.id
                    ? 'bg-accent/15 text-white'
                    : 'text-slate-400 hover:bg-scope-700/60 hover:text-slate-200'
                }`}
              >
                <span
                  className={`font-mono text-[10px] ${active === s.id ? 'text-accent' : 'text-slate-600'}`}
                >
                  {String(i).padStart(2, '0')}
                </span>
                {s.short}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      {open && (
        <div className="fixed inset-0 z-30 bg-black/60 lg:hidden" onClick={() => setOpen(false)} />
      )}
    </>
  )
}
