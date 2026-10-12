interface SegmentedProps<T extends string> {
  label: string;
  value: T;
  options: readonly { value: T; label: string }[];
  onChange: (value: T) => void;
}

/** Compact single-choice toggle (range, theme, filter tabs). */
export function Segmented<T extends string>({ label, value, options, onChange }: SegmentedProps<T>) {
  return (
    <div role="group" aria-label={label} className="inline-flex max-w-full overflow-x-auto rounded-xl border border-border bg-surface p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={value === o.value}
          onClick={() => onChange(o.value)}
          className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
            value === o.value ? 'bg-gradient-brand text-white' : 'text-text-muted hover:bg-text/5 hover:text-text'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
