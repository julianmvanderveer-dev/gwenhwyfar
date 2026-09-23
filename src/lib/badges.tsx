import React from "react";

type Tone = "green" | "red" | "orange" | "amber" | "blue" | "indigo" | "purple" | "gray";

const toneClasses: Record<Tone, { wrap: string; dot: string }> = {
  green: { wrap: "bg-green-50 text-green-800 border-green-200", dot: "bg-green-500" },
  red: { wrap: "bg-red-50 text-red-800 border-red-200", dot: "bg-red-500" },
  orange: { wrap: "bg-orange-50 text-orange-800 border-orange-200", dot: "bg-orange-500" },
  amber: { wrap: "bg-amber-50 text-amber-800 border-amber-200", dot: "bg-amber-500" },
  blue: { wrap: "bg-blue-50 text-blue-800 border-blue-200", dot: "bg-blue-500" },
  indigo: { wrap: "bg-indigo-50 text-indigo-800 border-indigo-200", dot: "bg-indigo-500" },
  purple: { wrap: "bg-purple-50 text-purple-800 border-purple-200", dot: "bg-purple-500" },
  gray: { wrap: "bg-muted text-muted-foreground border-border", dot: "bg-muted-foreground/60" },
};

export function StatusPill({
  label,
  tone = "gray",
  className = "",
}: {
  label: string;
  tone?: Tone;
  className?: string;
}) {
  const t = toneClasses[tone];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-medium leading-none whitespace-nowrap ${t.wrap} ${className}`}
    >
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${t.dot}`} />
      {label}
    </span>
  );
}

export const beoordelingBadge = (val: string | null) => {
  if (!val) return null;
  const tone: Record<string, Tone> = {
    goed: "green",
    niet_goed: "red",
    opmerking: "blue",
    nvt: "gray",
  };
  const label: Record<string, string> = {
    goed: "GOED",
    niet_goed: "NK",
    opmerking: "OPM",
    nvt: "N.V.T.",
  };
  return <StatusPill label={label[val] ?? val} tone={tone[val] ?? "gray"} />;
};

export const afwijkingBadge = (val: string | null) => {
  if (!val) return "—";
  const tone: Record<string, Tone> = {
    kritiek: "red",
    niet_kritiek: "orange",
  };
  const label: Record<string, string> = {
    kritiek: "KT",
    niet_kritiek: "NK",
  };
  return <StatusPill label={label[val] ?? val} tone={tone[val] ?? "gray"} />;
};

export const statusBadge = (val: string | null, variant?: "kt" | "nk") => {
  if (!val) return null;
  const tone: Record<string, Tone> = {
    nog_niet_begonnen: "gray",
    deel1_bezig: "blue",
    deel1_afgerond: "amber",
    deel2_bezig: "indigo",
    afgerond: "green",
    wacht_op_reactie: variant === "kt" ? "red" : "orange",
    reactie_ontvangen: "purple",
    wacht_op_herafmelding: "purple",
    gesloten: "green",
    reactie_goedgekeurd: "green",
  };
  const label: Record<string, string> = {
    nog_niet_begonnen: "Nog niet begonnen",
    deel1_bezig: "Deel 1 bezig",
    deel1_afgerond: "Deel 1 afgerond",
    deel2_bezig: "Deel 2 bezig",
    afgerond: "Afgerond",
    wacht_op_reactie: "Wacht op reactie",
    reactie_ontvangen: "Reactie ontvangen",
    wacht_op_herafmelding: "Wacht op nieuwe afmelding",
    gesloten: "Gesloten",
    reactie_goedgekeurd: "Reactie goedgekeurd",
  };
  return <StatusPill label={label[val] ?? val} tone={tone[val] ?? "gray"} />;
};
