import React from "react";

export const beoordelingBadge = (val: string | null) => {
  if (!val) return null;
  const map: Record<string, string> = {
    goed: "bg-green-100 text-green-700",
    niet_goed: "bg-red-100 text-red-700",
    opmerking: "bg-blue-100 text-blue-700",
    nvt: "bg-gray-100 text-gray-700",
  };
  const label: Record<string, string> = {
    goed: "GOED",
    niet_goed: "NK",
    opmerking: "OPM",
    nvt: "N.V.T.",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${map[val] ?? ""}`}>
      {label[val] ?? val}
    </span>
  );
};

export const afwijkingBadge = (val: string | null) => {
  if (!val) return "—";
  const map: Record<string, string> = {
    kritiek: "bg-red-100 text-red-700",
    niet_kritiek: "bg-orange-100 text-orange-700",
  };
  const label: Record<string, string> = {
    kritiek: "KT",
    niet_kritiek: "NK",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${map[val] ?? ""}`}>
      {label[val] ?? val}
    </span>
  );
};

export const statusBadge = (val: string | null, variant?: "kt" | "nk") => {
  if (!val) return null;
  const map: Record<string, string> = {
    nog_niet_begonnen: "bg-gray-100 text-gray-700",
    deel1_bezig: "bg-blue-100 text-blue-700",
    deel1_afgerond: "bg-yellow-100 text-yellow-700",
    deel2_bezig: "bg-blue-100 text-blue-700",
    afgerond: "bg-green-100 text-green-700",
    wacht_op_reactie: variant === "kt" ? "bg-red-100 text-red-700" : "bg-orange-100 text-orange-700",
    reactie_ontvangen: "bg-yellow-100 text-yellow-700",
    wacht_op_herafmelding: "bg-purple-100 text-purple-700",
    gesloten: "bg-green-200 text-green-800",
    reactie_goedgekeurd: "bg-green-100 text-green-700",
  };
  const label: Record<string, string> = {
    nog_niet_begonnen: "Nog niet begonnen",
    deel1_bezig: "Deel 1 bezig",
    deel1_afgerond: "Deel 1 afgerond",
    deel2_bezig: "Deel 2 bezig",
    afgerond: "Afgerond",
    wacht_op_reactie: "Reactie EP-adviseur gevraagd",
    reactie_ontvangen: "Reactie ontvangen",
    wacht_op_herafmelding: "Wacht op nieuwe afmelding",
    gesloten: "Gesloten",
    reactie_goedgekeurd: "Reactie goedgekeurd",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${map[val] ?? "bg-gray-100 text-gray-700"}`}>
      {label[val] ?? val}
    </span>
  );
};
