import { Card } from "@/components/ui/Card";

/** Temporary placeholder for screens not built yet. Removed as each phase lands. */
export function PhaseNote({ phase, items }: { phase: number; items: string[] }) {
  return (
    <Card tone="dashed">
      <span className="text-xs font-semibold text-muted">Coming in phase {phase}</span>
      <ul className="list-disc pl-5 text-sm">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </Card>
  );
}
