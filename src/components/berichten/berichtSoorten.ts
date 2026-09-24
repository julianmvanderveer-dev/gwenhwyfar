export const BERICHT_SOORTEN: { key: string; label: string }[] = [
  { key: "algemeen", label: "Algemeen" },
  { key: "intervisie", label: "Intervisie" },
  { key: "bengcert_dag", label: "BengCert-dag" },
  { key: "persoonlijk", label: "Persoonlijk" },
];
export const soortLabel = (k: string) => BERICHT_SOORTEN.find((s) => s.key === k)?.label ?? k;

export const formatEvenement = (datum: string | null, locatie: string | null) => {
  const delen: string[] = [];
  if (datum) delen.push(new Date(datum).toLocaleString("nl-NL", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }));
  if (locatie) delen.push(locatie);
  return delen.join(" · ");
};
