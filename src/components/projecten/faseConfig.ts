import { FolderKanban, Clock3, AlertTriangle, CheckCircle2, Mail, FileCheck } from "lucide-react";

export type FaseKey =
  | "nieuw"
  | "deel1_bezig"
  | "wacht_op_deel2"
  | "deel2_bezig"
  | "wacht_op_reactie_ep"
  | "afgerond"
  | "reactie_ontvangen";

export const faseConfig: Record<FaseKey, {
  titel: string;
  omschrijving: string;
  icon: typeof FolderKanban;
  accentClass: string;
}> = {
  nieuw: {
    titel: "Nieuwe projecten",
    omschrijving: "Nieuw aangemaakt, moet worden opgepakt.",
    icon: FolderKanban,
    accentClass: "text-muted-foreground",
  },
  deel1_bezig: {
    titel: "Deel 1 bezig",
    omschrijving: "In behandeling bij de tekenaar.",
    icon: Clock3,
    accentClass: "text-accent",
  },
  wacht_op_deel2: {
    titel: "Wacht op deel 2",
    omschrijving: "Deel 1 afgerond, wacht op auditor.",
    icon: FileCheck,
    accentClass: "text-warning",
  },
  deel2_bezig: {
    titel: "Deel 2 bezig",
    omschrijving: "Auditor is bezig met deel 2.",
    icon: Clock3,
    accentClass: "text-accent",
  },
  wacht_op_reactie_ep: {
    titel: "Reactie EP-adviseur gevraagd",
    omschrijving: "Audit verzonden, wacht op reactie EP-adviseur.",
    icon: AlertTriangle,
    accentClass: "text-destructive",
  },
  afgerond: {
    titel: "Afgerond",
    omschrijving: "Audit goedgekeurd. Nog 14 dagen zichtbaar.",
    icon: CheckCircle2,
    accentClass: "text-primary",
  },
  reactie_ontvangen: {
    titel: "Reactie ontvangen",
    omschrijving: "EP-adviseur heeft gereageerd, wacht op opvolging.",
    icon: Mail,
    accentClass: "text-warning",
  },
};

export const orderedFases: FaseKey[] = [
  "nieuw",
  "deel1_bezig",
  "wacht_op_deel2",
  "deel2_bezig",
  "wacht_op_reactie_ep",
  "afgerond",
  "reactie_ontvangen",
];

export type HoofdgroepKey = "nieuw" | "bezig" | "afgerond";

export const hoofdgroepConfig: Record<HoofdgroepKey, { titel: string; omschrijving: string }> = {
  nieuw: { titel: "Nieuw", omschrijving: "Nog niet opgepakt" },
  bezig: { titel: "Bezig", omschrijving: "In behandeling" },
  afgerond: { titel: "Afgerond", omschrijving: "Audit afgerond (14 dagen zichtbaar)" },
};

export const bezigFases: FaseKey[] = [
  "deel1_bezig",
  "wacht_op_deel2",
  "deel2_bezig",
  "wacht_op_reactie_ep",
  "reactie_ontvangen",
];

export function getFaseHoofdgroep(fase: FaseKey): HoofdgroepKey {
  if (fase === "nieuw") return "nieuw";
  if (fase === "afgerond") return "afgerond";
  return "bezig";
}

/** Map DB project_status to visual fase */
export function getProjectFase(
  status: string,
  hasReactieOntvangen: boolean
): FaseKey {
  switch (status) {
    case "nog_niet_begonnen": return "nieuw";
    case "deel1_bezig": return "deel1_bezig";
    case "deel1_afgerond": return "wacht_op_deel2";
    case "deel2_bezig": return "deel2_bezig";
    case "wacht_op_reactie": return hasReactieOntvangen ? "reactie_ontvangen" : "wacht_op_reactie_ep";
    case "afgerond": return "afgerond";
    default: return "nieuw";
  }
}
