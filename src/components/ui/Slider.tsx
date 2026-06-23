interface SliderProps {
  label: string
  value: number
  min: number
  max: number
  step?: number
  onChange: (v: number) => void
  /** Formátovanie zobrazenej hodnoty (napr. jednotky). */
  format?: (v: number) => string
  accentColor?: string
}

/**
 * Slider — jednotný ovládač s viditeľnou aktuálnou hodnotou.
 * Hodnota sa zobrazuje mimo canvasu (v DOM), ako vyžaduje zadanie.
 */
export function Slider({
  label,
  value,
  min,
  max,
  step = 0.01,
  onChange,
  format,
  accentColor,
}: SliderProps) {
  return (
    <label className="block">
      <div className="mb-1 flex items-baseline justify-between gap-2">
        <span className="text-xs font-medium text-slate-400">{label}</span>
        <span
          className="font-mono text-xs tabular-nums"
          style={{ color: accentColor ?? '#ff8c5a' }}
        >
          {format ? format(value) : value.toFixed(2)}
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
