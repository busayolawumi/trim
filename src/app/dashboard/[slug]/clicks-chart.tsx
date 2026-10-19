"use client";

import { useState, type KeyboardEvent, type PointerEvent } from "react";

/** One day/week/month: `tick` labels the x-axis, `label` the tooltip. */
export type ChartPoint = { tick: string; label: string; value: number };

const compact = new Intl.NumberFormat("en", { notation: "compact" });

/** Rounds the top of the y-axis up to a clean step (1, 2 or 5 × 10ⁿ), with about 4 steps. */
function yScale(max: number) {
  if (max <= 4) return { top: 4, step: 1 };
  const raw = max / 4;
  const pow = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 5, 10].find((m) => m * pow >= raw)! * pow;
  return { top: Math.ceil(max / step) * step, step };
}

/**
 * A smooth line through the points that never overshoots them (monotone cubic, as in d3's
 * curveMonotoneX), so a day with no clicks never dips below zero.
 */
function smoothPath(pts: [number, number][]) {
  const n = pts.length;
  const slopes = pts.slice(1).map(([x, y], i) => (y - pts[i][1]) / (x - pts[i][0]));
  const tangents = pts.map((_, i) =>
    i === 0
      ? slopes[0]
      : i === n - 1
        ? slopes[n - 2]
        : slopes[i - 1] * slopes[i] <= 0
          ? 0
          : (slopes[i - 1] + slopes[i]) / 2,
  );
  // Fritsch–Carlson: shrink tangents that would make the curve bulge past a neighbour.
  slopes.forEach((m, i) => {
    if (m === 0) {
      tangents[i] = tangents[i + 1] = 0;
      return;
    }
    const a = tangents[i] / m;
    const b = tangents[i + 1] / m;
    const s = a * a + b * b;
    if (s > 9) {
      tangents[i] = (3 / Math.sqrt(s)) * a * m;
      tangents[i + 1] = (3 / Math.sqrt(s)) * b * m;
    }
  });

  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < n - 1; i++) {
    const [x0, y0] = pts[i];
    const [x1, y1] = pts[i + 1];
    const h = (x1 - x0) / 3;
    d += ` C${x0 + h},${y0 + tangents[i] * h} ${x1 - h},${y1 - tangents[i + 1] * h} ${x1},${y1}`;
  }
  return d;
}

/**
 * Line chart of clicks over time. Hover (or drag on a phone) to read a point; when focused, the
 * arrow keys step through them. The same numbers are in a table for screen readers.
 */
export function ClicksChart({ points, caption }: { points: ChartPoint[]; caption: string }) {
  const [active, setActive] = useState<number | null>(null);
  const n = points.length;
  const { top, step } = yScale(Math.max(0, ...points.map((p) => p.value)));
  const yTicks = Array.from({ length: top / step + 1 }, (_, i) => i * step);

  // Percentages of the plot area. A single point sits in the middle.
  const x = (i: number) => (n === 1 ? 50 : (i / (n - 1)) * 100);
  const y = (v: number) => 100 - (v / top) * 100;
  const line = n > 1 ? smoothPath(points.map((p, i) => [x(i), y(p.value)])) : "";

  // Up to 6 evenly spaced dates under the axis; on phones only every other one.
  const tickCount = Math.min(n, 6);
  const xTicks = [...new Set(Array.from({ length: tickCount }, (_, i) => Math.round((i * (n - 1)) / Math.max(1, tickCount - 1))))];

  function pointAt(e: PointerEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const i = Math.round(((e.clientX - rect.left) / rect.width) * (n - 1));
    setActive(Math.min(n - 1, Math.max(0, i)));
  }

  function onKeyDown(e: KeyboardEvent) {
    const current = active ?? n - 1;
    const next = { ArrowLeft: current - 1, ArrowRight: current + 1, Home: 0, End: n - 1 }[e.key];
    if (next === undefined) return;
    e.preventDefault();
    setActive(Math.min(n - 1, Math.max(0, next)));
  }

  const shown = active ?? (n === 1 ? 0 : null);
  const point = shown !== null ? points[shown] : null;

  return (
    <figure>
      <div className="flex gap-2">
        {/* Y-axis labels, lined up with the gridlines. */}
        <div aria-hidden className="relative h-56 w-8 shrink-0 text-right text-xs tabular-nums text-zinc-500">
          {yTicks.map((t) => (
            <span key={t} className="absolute right-0 -translate-y-1/2" style={{ top: `${y(t)}%` }}>
              {compact.format(t)}
            </span>
          ))}
        </div>

        <div
          tabIndex={0}
          role="group"
          aria-label={`${caption}. Use the arrow keys to read each value.`}
          onPointerMove={pointAt}
          onPointerDown={pointAt}
          onPointerLeave={() => setActive(null)}
          onFocus={() => setActive((a) => a ?? n - 1)}
          onBlur={() => setActive(null)}
          onKeyDown={onKeyDown}
          className="relative h-56 flex-1 touch-pan-y rounded outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20 dark:focus-visible:ring-zinc-100/20"
        >
          {yTicks.map((t) => (
            <div
              key={t}
              className={`absolute inset-x-0 h-px ${t === 0 ? "bg-zinc-200 dark:bg-zinc-700" : "bg-zinc-100 dark:bg-zinc-800"}`}
              style={{ top: `${y(t)}%` }}
            />
          ))}

          {/* Stretched to fill the box; the stroke keeps its width because it doesn't scale. */}
          <svg
            aria-hidden
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            className="absolute inset-0 h-full w-full overflow-visible"
          >
            {line && (
              <>
                <path d={`${line} L100,100 L0,100 Z`} className="fill-emerald-600/10" />
                <path
                  d={line}
                  fill="none"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                  className="stroke-emerald-600"
                />
              </>
            )}
          </svg>

          {shown !== null && point && (
            <>
              {n > 1 && (
                <div className="absolute inset-y-0 w-px bg-zinc-300 dark:bg-zinc-600" style={{ left: `${x(shown)}%` }} />
              )}
              <div
                className="absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-600 ring-2 ring-white dark:ring-zinc-900"
                style={{ left: `${x(shown)}%`, top: `${y(point.value)}%` }}
              />
              {/* Beside the crosshair, on whichever side has more room. */}
              <div
                aria-live="polite"
                className={`pointer-events-none absolute top-0 whitespace-nowrap rounded-lg border border-zinc-200 bg-white px-3 py-2 shadow-sm dark:border-zinc-700 dark:bg-zinc-800 ${
                  x(shown) > 50 ? "-translate-x-full -ml-3" : "ml-3"
                }`}
                style={{ left: `${x(shown)}%` }}
              >
                <p className="text-base font-semibold tabular-nums">
                  {point.value.toLocaleString("en")} {point.value === 1 ? "click" : "clicks"}
                </p>
                <p className="text-xs text-zinc-500">{point.label}</p>
              </div>
            </>
          )}
        </div>
      </div>

      <div aria-hidden className="relative mt-2 ml-10 h-4 text-xs text-zinc-500">
        {xTicks.map((i, j) => (
          <span
            key={i}
            className={`absolute whitespace-nowrap ${
              j === 0 ? "" : j === xTicks.length - 1 ? "-translate-x-full" : "-translate-x-1/2"
            } ${j % 2 === 1 && j !== xTicks.length - 1 ? "max-sm:hidden" : ""}`}
            style={{ left: `${n === 1 ? 0 : x(i)}%` }}
          >
            {points[i].tick}
          </span>
        ))}
      </div>

      <table className="sr-only">
        <caption>{caption}</caption>
        <thead>
          <tr>
            <th scope="col">Date</th>
            <th scope="col">Clicks</th>
          </tr>
        </thead>
        <tbody>
          {points.map((p) => (
            <tr key={p.label}>
              <td>{p.label}</td>
              <td>{p.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
