import { Nav } from './components/Nav'
import { HookSection } from './sections/HookSection'
import { DomainsSection } from './sections/DomainsSection'
import { SynthesisSection } from './sections/SynthesisSection'
import { SamplingSection } from './sections/SamplingSection'
import { DftSection } from './sections/DftSection'
import { WindingSection } from './sections/WindingSection'
import { MatrixSection } from './sections/MatrixSection'
import { CooleyTukeySection } from './sections/CooleyTukeySection'
import { ButterflySection } from './sections/ButterflySection'
import { BitReversalSection } from './sections/BitReversalSection'

export default function App() {
  return (
    <div className="min-h-screen">
      <Nav />
      <main className="lg:pl-64">
        <HookSection />
        <DomainsSection />
        <SynthesisSection />
        <SamplingSection />
        <DftSection />
        <WindingSection />
        <MatrixSection />
        <CooleyTukeySection />
        <ButterflySection />
        <BitReversalSection />
        <footer className="border-t border-scope-600/40 px-4 py-8 text-center text-xs text-slate-600">
          FFT LAB · Extended v2 · vlastná radix-2 Cooley-Tukey implementácia ·{' '}
          {new Date().getFullYear()}
        </footer>
      </main>
    </div>
  )
}
