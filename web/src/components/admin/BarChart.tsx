import { useState } from 'react';
import { niceCeil } from '../../lib/admin/chartScale';

export interface BarPoint {
  /** Axis / tooltip label, e.g. "Oct 11". */
  label: string;
  value: number;
}

interface BarChartProps {
  title: string;
  /** Unit noun for the tooltip, e.g. "users". */
  unit: string;
  points: readonly BarPoint[];
}

const PLOT_HEIGHT = 'h-40';

/**
 * Single-series daily column chart (no legend — the title names the series).
 * Thin columns, 2px gaps, 4px rounded tops on the baseline, recessive grid,
 * and a hover/focus tooltip per column whose hit target is the full column.
 */
export function BarChart({ title, unit, points }: BarChartProps) {
  const [active, setActive] = useState<number | null>(null);
  const max = niceCeil(Math.max(0, ...points.map((p) => p.value)));
  const ticks = [max, max / 2, 0];
  const activePoint = active === null ? null : points[active];
  const labelIndexes = new Set([0, Math.floor((points.length - 1) / 2), points.length - 1]);

  return (
    <figure className="min-w-0 rounded-2xl border border-border bg-surface p-4">
      <figcaption className="mb-3 flex items-baseline justify-between gap-2">
        <span className="text-sm font-semibold">{title}</span>
        <span className="truncate text-xs text-text-muted tabular-nums">
          {activePoint ? `${activePoint.label}: ${activePoint.value.toLocaleString()} ${unit}` : ' '}
        </span>
      </figcaption>
      <div className="flex gap-2">
        <div className={`relative ${PLOT_HEIGHT} w-8 shrink-0 text-right text-[10px] text-text-faint tabular-nums`} aria-hidden="true">
          {ticks.map((tick, i) => (
            <span key={tick} className="absolute right-0 -translate-y-1/2" style={{ top: `${(i / (ticks.length - 1)) * 100}%` }}>
              {Number.isInteger(tick) ? tick.toLocaleString() : ''}
            </span>
          ))}
        </div>
        <div className="min-w-0 flex-1">
          <div className={`relative ${PLOT_HEIGHT}`}>
            {ticks.map((tick, i) => (
              <div
                key={tick}
                aria-hidden="true"
                className={`absolute inset-x-0 border-t ${i === ticks.length - 1 ? 'border-text-faint/60' : 'border-border/70 border-dashed'}`}
                style={{ top: `${(i / (ticks.length - 1)) * 100}%` }}
              />
            ))}
            <ul className="absolute inset-0 flex items-end gap-[2px]" onMouseLeave={() => setActive(null)}>
              {points.map((p, i) => (
                <li key={p.label} className="flex h-full min-w-0 flex-1">
                  <button
                    type="button"
                    aria-label={`${p.label}: ${p.value} ${unit}`}
                    onMouseEnter={() => setActive(i)}
                    onFocus={() => setActive(i)}
                    onBlur={() => setActive(null)}
                    className="flex h-full w-full items-end rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-brand-magenta"
                  >
                    <span
                      className={`block w-full rounded-t-[4px] bg-chart transition-opacity ${
                        active === null || active === i ? 'opacity-100' : 'opacity-40'
                      }`}
                      style={{ height: p.value > 0 ? `max(2px, ${(p.value / max) * 100}%)` : '0' }}
                    />
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <div className="mt-1 flex text-[10px] text-text-faint" aria-hidden="true">
            {points.map((p, i) => (
              <span
                key={p.label}
                className={`min-w-0 flex-1 overflow-visible whitespace-nowrap ${
                  i === 0 ? 'text-left' : i === points.length - 1 ? 'text-right' : 'text-center'
                }`}
              >
                {labelIndexes.has(i) ? p.label : ''}
              </span>
            ))}
          </div>
        </div>
      </div>
    </figure>
  );
}
