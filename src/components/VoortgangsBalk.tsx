import { cn } from "@/lib/utils";

interface VoortgangsBalkProps {
  /** 0-100+, of null als er geen budget is */
  percentage: number | null;
  /** Drempel (0-100) waarboven de balk oranje kleurt */
  drempel?: number;
  /** Vaste kleurklasse, bijvoorbeeld voor spaardoelen (altijd accentkleur) */
  vasteKleur?: string;
  className?: string;
}

/**
 * Voortgangsbalk met de budgetkleuren: groen tot 75%, geel tot de
 * waarschuwingsdrempel, oranje daarboven en rood boven 100%.
 */
export function VoortgangsBalk({
  percentage,
  drempel = 90,
  vasteKleur,
  className,
}: VoortgangsBalkProps) {
  const p = percentage ?? 0;
  const kleur =
    vasteKleur ??
    (percentage === null
      ? "bg-muted-foreground/30"
      : p > 100
        ? "bg-destructive"
        : p >= drempel
          ? "bg-waarschuwing"
          : p >= 75
            ? "bg-yellow-500"
            : "bg-succes");

  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full bg-muted", className)}>
      <div
        className={cn("h-full rounded-full transition-all", kleur)}
        style={{ width: `${Math.min(100, Math.max(0, p))}%` }}
      />
    </div>
  );
}
