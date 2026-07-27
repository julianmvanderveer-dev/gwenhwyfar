import { Delete } from "lucide-react";

interface CijferblokProps {
  onCijfer: (cijfer: string) => void;
  onKomma: () => void;
  onWissen: () => void;
}

const rijen = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
] as const;

/**
 * Vast cijferblok in de app zelf, zodat het bedrag direct intikbaar is
 * zonder te wachten op het systeemtoetsenbord.
 */
export function Cijferblok({ onCijfer, onKomma, onWissen }: CijferblokProps) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {rijen.flat().map((cijfer) => (
        <Toets key={cijfer} onClick={() => onCijfer(cijfer)}>
          {cijfer}
        </Toets>
      ))}
      <Toets onClick={onKomma}>,</Toets>
      <Toets onClick={() => onCijfer("0")}>0</Toets>
      <Toets onClick={onWissen} label="Wissen">
        <Delete className="h-6 w-6" />
      </Toets>
    </div>
  );
}

function Toets({
  children,
  onClick,
  label,
}: {
  children: React.ReactNode;
  onClick: () => void;
  label?: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="flex h-14 items-center justify-center rounded-xl bg-secondary text-2xl font-medium text-secondary-foreground transition-colors active:bg-muted"
    >
      {children}
    </button>
  );
}
