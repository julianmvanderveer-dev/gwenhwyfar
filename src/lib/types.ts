// Alle bedragen zijn in centen (integer), zodat er nooit afrondingsfouten
// met zwevendekommagetallen ontstaan. Datums zijn ISO-strings (jjjj-mm-dd)
// zodat ze sorteerbaar zijn in IndexedDB.

export type TransactieType = "uitgave" | "inkomst";

export interface Categorie {
  id?: number;
  naam: string;
  emoji: string;
  /** Maandbudget in centen; 0 = geen budget ingesteld */
  budget: number;
  verborgen: boolean;
  volgorde: number;
}

export interface Transactie {
  id?: number;
  type: TransactieType;
  /** Altijd positief, in centen */
  bedrag: number;
  /** jjjj-mm-dd */
  datum: string;
  categorieId?: number;
  omschrijving?: string;
  werkgeverId?: number;
  uren?: number;
  spaardoelId?: number;
  /** Epoch ms van aanmaak, voor stabiele sortering binnen een dag */
  aangemaakt: number;
  /** Aangemaakt door de demodata-knop; wordt gewist met "demodata wissen" */
  demo?: boolean;
}

export interface Spaardoel {
  id?: number;
  naam: string;
  emoji: string;
  /** In centen */
  streefbedrag: number;
  /** Al gespaard geld buiten de app om, in centen */
  startbedrag: number;
  /** jjjj-mm-dd, optioneel */
  streefdatum?: string;
  behaald: boolean;
  demo?: boolean;
}

export interface Werkgever {
  id?: number;
  naam: string;
  /** In centen per uur */
  uurloon: number;
}

export interface Snelknop {
  id?: number;
  naam: string;
  /** In centen */
  bedrag: number;
  categorieId: number;
  /** Hoe vaak gebruikt, voor sortering */
  gebruikt: number;
  demo?: boolean;
}

export interface Instellingen {
  id?: number;
  /** In centen, mag negatief zijn */
  beginsaldo: number;
  /** Percentage (0-100) waarboven een categorie als "bijna op" geldt */
  waarschuwingsdrempel: number;
  thema: "licht" | "donker" | "systeem";
}
