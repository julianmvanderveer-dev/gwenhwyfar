import { FolderKanban, Clock3, AlertTriangle, CheckCircle2, Mail } from "lucide-react";

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
  borderClass: string;
  bgClass: string;
}> = {
  nieuw: {
    titel: "1. Nieuwe projecten",
    omschrijving: "Nieuw aangemaakt, moet worden opgepakt.",
    icon: FolderKanban,
    borderClass: "border-border",
    bgClass: "bg-muted/50",
  },
  deel1_bezig: {
    titel: "2. Deel 1 bezig",
    omschrijving: "In behandeling bij de tekenaar.",
    icon: Clock3,
    borderClass: "border-primary/30",
    bgClass: "bg-primary/5",
  },
  wacht_op_deel2: {
    titel: "3. Wacht op deel 2",
    omschrijving: "Deel 1 afgerond, wacht op auditor.",
    icon: Clock3,
    borderClass: "border-accent-foreground/20",
    bgClass: "bg-accent/50",
  },
  deel2_bezig: {
    titel: "4. Deel 2 bezig",
    omschrijving: "Auditor is bezig met deel 2.",
    icon: Clock3,
    borderClass: "border-primary/30",
    bgClass: "bg-primary/5",
  },
  wacht_op_reactie_ep: {
    titel: "5. Wacht op reactie EP",
    omschrijving: "Audit verzonden, wacht op reactie EP-adviseur.",
    icon: AlertTriangle,
    borderClass: "border-destructive/30",
    bgClass: "bg-destructive/5",
  },
  afgerond: {
    titel: "6. Afgerond",
    omschrijving: "Audit goedgekeurd. Nog 14 dagen zichtbaar.",
    icon: CheckCircle2,
    borderClass: "border-primary/20",
    bgClass: "bg-primary/5",
  },
  reactie_ontvangen: {
    titel: "7. Reactie ontvangen",
    omschrijving: "EP-adviseur heeft gereageerd, wacht op opvolging.",
    icon: Mail,
    borderClass: "border-accent-foreground/30",
    bgClass: "bg-accent",
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
