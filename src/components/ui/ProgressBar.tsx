/** Horizontal progress bar. `value` is a fraction from 0 to 1. */
export function ProgressBar({ value, label }: { value: number; label: string }) {
  const percent = Math.round(Math.min(Math.max(value, 0), 1) * 100);
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
      className="h-2.5 overflow-hidden rounded-full bg-track"
    >
      <div
        className="h-full rounded-full bg-accent bg-[linear-gradient(90deg,transparent,rgb(255_255_255/0.28))] transition-[width] duration-500 ease-out"
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}
