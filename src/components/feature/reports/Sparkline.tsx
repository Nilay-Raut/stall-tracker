/**
 * A tiny line of daily quantities beside an item. Decorative: the numbers next to
 * it carry the meaning, so screen readers skip it. Single series, accent stroke.
 */
export function Sparkline({
  values,
  width = 64,
  height = 22,
}: {
  values: number[];
  width?: number;
  height?: number;
}) {
  if (values.length < 2 || values.every((v) => v === 0)) return null;
  const max = Math.max(...values);
  const pad = 2;
  const step = (width - pad * 2) / (values.length - 1);
  const y = (v: number) => height - pad - (v / max) * (height - pad * 2);
  const points = values.map((v, i) => `${(pad + i * step).toFixed(1)},${y(v).toFixed(1)}`);
  const lastX = pad + (values.length - 1) * step;
  return (
    <svg
      aria-hidden
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="shrink-0 overflow-visible"
    >
      <polyline
        points={points.join(" ")}
        fill="none"
        stroke="var(--color-accent)"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={lastX} cy={y(values.at(-1)!)} r={2.5} fill="var(--color-accent)" />
    </svg>
  );
}
