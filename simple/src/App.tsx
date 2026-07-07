import { Nav } from './components/Nav'
import { IntroSection } from './sections/IntroSection'
import { TimeFreqSection } from './sections/TimeFreqSection'
import { SynthesisSection } from './sections/SynthesisSection'
import { SamplingSection } from './sections/SamplingSection'
import { DftSection } from './sections/DftSection'
import { WindingSection } from './sections/WindingSection'
import { CorrelationSection } from './sections/CorrelationSection'
import { ComplexitySection } from './sections/ComplexitySection'
import { CooleyTukeySection } from './sections/CooleyTukeySection'
import { BitReversalSection } from './sections/BitReversalSection'
import { WindowingSection } from './sections/WindowingSection'
import { LiveSection } from './sections/LiveSection'
import { CheatsheetSection } from './sections/CheatsheetSection'

export default function App() {
  return (
    <div className="min-h-screen">
      <Nav />
      <main className="md:pl-60">
        <IntroSection />
        <TimeFreqSection />
        <SynthesisSection />
        <SamplingSection />
        <DftSection />
        <WindingSection />
        <CorrelationSection />
        <ComplexitySection />
        <CooleyTukeySection />
        <BitReversalSection />
        <WindowingSection />
        <LiveSection />
        <CheatsheetSection />
        <footer className="border-t border-ink-600/50 px-5 py-10 text-center text-xs text-slate-600">
          Vytvorené ako interaktívna vzdelávacia pomôcka o FFT · vlastná
          implementácia Cooley-Tukey radix-2 · {new Date().getFullYear()}
        </footer>
      </main>
    </div>
  )
}
