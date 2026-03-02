export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      adviseurs: {
        Row: {
          actief: boolean
          email: string | null
          id: string
          naam: string
          nummer: number
          user_id: string | null
        }
        Insert: {
          actief?: boolean
          email?: string | null
          id?: string
          naam: string
          nummer: number
          user_id?: string | null
        }
        Update: {
          actief?: boolean
          email?: string | null
          id?: string
          naam?: string
          nummer?: number
          user_id?: string | null
        }
        Relationships: []
      }
      findings: {
        Row: {
          beoordeling: Database["public"]["Enums"]["beoordeling_type"] | null
          controlepunt: string
          created_at: string
          deadline: string | null
          deel: number
          eigenaar_beoordeling:
            | Database["public"]["Enums"]["eigenaar_type"]
            | null
          id: string
          onderdeel: string
          project_id: string
          status: Database["public"]["Enums"]["finding_status"]
          toelichting: string | null
          type_afwijking: Database["public"]["Enums"]["afwijking_type"] | null
          zichtbaar_voor_adviseur: boolean
        }
        Insert: {
          beoordeling?: Database["public"]["Enums"]["beoordeling_type"] | null
          controlepunt: string
          created_at?: string
          deadline?: string | null
          deel?: number
          eigenaar_beoordeling?:
            | Database["public"]["Enums"]["eigenaar_type"]
            | null
          id?: string
          onderdeel: string
          project_id: string
          status?: Database["public"]["Enums"]["finding_status"]
          toelichting?: string | null
          type_afwijking?: Database["public"]["Enums"]["afwijking_type"] | null
          zichtbaar_voor_adviseur?: boolean
        }
        Update: {
          beoordeling?: Database["public"]["Enums"]["beoordeling_type"] | null
          controlepunt?: string
          created_at?: string
          deadline?: string | null
          deel?: number
          eigenaar_beoordeling?:
            | Database["public"]["Enums"]["eigenaar_type"]
            | null
          id?: string
          onderdeel?: string
          project_id?: string
          status?: Database["public"]["Enums"]["finding_status"]
          toelichting?: string | null
          type_afwijking?: Database["public"]["Enums"]["afwijking_type"] | null
          zichtbaar_voor_adviseur?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "findings_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          afzender_id: string
          bericht: string
          datum: string
          finding_id: string
          id: string
        }
        Insert: {
          afzender_id: string
          bericht: string
          datum?: string
          finding_id: string
          id?: string
        }
        Update: {
          afzender_id?: string
          bericht?: string
          datum?: string
          finding_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_finding_id_fkey"
            columns: ["finding_id"]
            isOneToOne: false
            referencedRelation: "findings"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          actief: boolean
          created_at: string
          email: string
          id: string
          naam: string
        }
        Insert: {
          actief?: boolean
          created_at?: string
          email: string
          id: string
          naam: string
        }
        Update: {
          actief?: boolean
          created_at?: string
          email?: string
          id?: string
          naam?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          aangemaakt_door: string
          adviseur_id: string | null
          audit_categorie: Database["public"]["Enums"]["audit_categorie"]
          audit_soort: Database["public"]["Enums"]["audit_soort"]
          datum_aangemaakt: string
          id: string
          prioriteit: boolean
          projectnaam: string
          status: Database["public"]["Enums"]["project_status"]
          toelatingsaudit: boolean
        }
        Insert: {
          aangemaakt_door: string
          adviseur_id?: string | null
          audit_categorie?: Database["public"]["Enums"]["audit_categorie"]
          audit_soort?: Database["public"]["Enums"]["audit_soort"]
          datum_aangemaakt?: string
          id?: string
          prioriteit?: boolean
          projectnaam: string
          status?: Database["public"]["Enums"]["project_status"]
          toelatingsaudit?: boolean
        }
        Update: {
          aangemaakt_door?: string
          adviseur_id?: string | null
          audit_categorie?: Database["public"]["Enums"]["audit_categorie"]
          audit_soort?: Database["public"]["Enums"]["audit_soort"]
          datum_aangemaakt?: string
          id?: string
          prioriteit?: boolean
          projectnaam?: string
          status?: Database["public"]["Enums"]["project_status"]
          toelatingsaudit?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "projects_adviseur_id_fkey"
            columns: ["adviseur_id"]
            isOneToOne: false
            referencedRelation: "adviseurs"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_any_role: {
        Args: { _roles: Database["public"]["Enums"]["app_role"][] }
        Returns: boolean
      }
      has_role: {
        Args: { _role: Database["public"]["Enums"]["app_role"] }
        Returns: boolean
      }
    }
    Enums: {
      afwijking_type: "kritiek" | "niet_kritiek"
      app_role: "beheer" | "tekenaar" | "auditor" | "ep_adviseur"
      audit_categorie: "EPW-B" | "EPW-D" | "EPU-B" | "EPU-D" | "MWA-B" | "MWA-U"
      audit_soort: "dossieraudit" | "projectaudit"
      beoordeling_type: "goed" | "niet_goed" | "interne_alert"
      eigenaar_type: "tekenaar" | "auditor"
      finding_status: "open" | "reactie_ontvangen" | "gesloten"
      project_status:
        | "geselecteerd"
        | "deel1_bezig"
        | "wacht_op_deel2"
        | "afgerond"
        | "reactie_open"
        | "gesloten"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      afwijking_type: ["kritiek", "niet_kritiek"],
      app_role: ["beheer", "tekenaar", "auditor", "ep_adviseur"],
      audit_categorie: ["EPW-B", "EPW-D", "EPU-B", "EPU-D", "MWA-B", "MWA-U"],
      audit_soort: ["dossieraudit", "projectaudit"],
      beoordeling_type: ["goed", "niet_goed", "interne_alert"],
      eigenaar_type: ["tekenaar", "auditor"],
      finding_status: ["open", "reactie_ontvangen", "gesloten"],
      project_status: [
        "geselecteerd",
        "deel1_bezig",
        "wacht_op_deel2",
        "afgerond",
        "reactie_open",
        "gesloten",
      ],
    },
  },
} as const
