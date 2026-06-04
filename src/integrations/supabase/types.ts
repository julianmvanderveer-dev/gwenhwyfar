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
      app_settings: {
        Row: {
          key: string
          updated_at: string | null
          value: string
        }
        Insert: {
          key: string
          updated_at?: string | null
          value: string
        }
        Update: {
          key?: string
          updated_at?: string | null
          value?: string
        }
        Relationships: []
      }
      checklist_templates: {
        Row: {
          audit_categorie: Database["public"]["Enums"]["audit_categorie"]
          code: string
          controlepunt: string
          deel: number
          id: string
          onderdeel: string
          sector_id: string | null
        }
        Insert: {
          audit_categorie: Database["public"]["Enums"]["audit_categorie"]
          code: string
          controlepunt: string
          deel?: number
          id?: string
          onderdeel: string
          sector_id?: string | null
        }
        Update: {
          audit_categorie?: Database["public"]["Enums"]["audit_categorie"]
          code?: string
          controlepunt?: string
          deel?: number
          id?: string
          onderdeel?: string
          sector_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "checklist_templates_sector_id_fkey"
            columns: ["sector_id"]
            isOneToOne: false
            referencedRelation: "sectoren"
            referencedColumns: ["id"]
          },
        ]
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      externe_rapportages: {
        Row: {
          bestand_pad: string | null
          bestandsnaam: string
          bron: string | null
          created_at: string
          geimporteerd_door: string | null
          id: string
          metadata: Json | null
          project_id: string
          status: string
        }
        Insert: {
          bestand_pad?: string | null
          bestandsnaam: string
          bron?: string | null
          created_at?: string
          geimporteerd_door?: string | null
          id?: string
          metadata?: Json | null
          project_id: string
          status?: string
        }
        Update: {
          bestand_pad?: string | null
          bestandsnaam?: string
          bron?: string | null
          created_at?: string
          geimporteerd_door?: string | null
          id?: string
          metadata?: Json | null
          project_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "externe_rapportages_geimporteerd_door_fkey"
            columns: ["geimporteerd_door"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "externe_rapportages_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback: {
        Row: {
          bericht: string
          created_at: string
          id: string
          pagina: string
          type: string
          user_id: string
        }
        Insert: {
          bericht: string
          created_at?: string
          id?: string
          pagina: string
          type?: string
          user_id: string
        }
        Update: {
          bericht?: string
          created_at?: string
          id?: string
          pagina?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      findings: {
        Row: {
          afwijking_kleiner_1pct: boolean
          beoordeling: Database["public"]["Enums"]["beoordeling_type"] | null
          concept_beoordeling: Json | null
          concept_reactie: Json | null
          controlepunt: string
          created_at: string
          deadline: string | null
          deel: number
          eigenaar_beoordeling:
            | Database["public"]["Enums"]["eigenaar_type"]
            | null
          goedgekeurd_op: string | null
          id: string
          onderdeel: string
          project_id: string
          status: Database["public"]["Enums"]["finding_status"]
          toegewezen_beoordelaar: string | null
          toelichting: string | null
          type_afwijking: Database["public"]["Enums"]["afwijking_type"] | null
          upload_vereist: boolean
          zichtbaar_voor_adviseur: boolean
        }
        Insert: {
          afwijking_kleiner_1pct?: boolean
          beoordeling?: Database["public"]["Enums"]["beoordeling_type"] | null
          concept_beoordeling?: Json | null
          concept_reactie?: Json | null
          controlepunt: string
          created_at?: string
          deadline?: string | null
          deel?: number
          eigenaar_beoordeling?:
            | Database["public"]["Enums"]["eigenaar_type"]
            | null
          goedgekeurd_op?: string | null
          id?: string
          onderdeel: string
          project_id: string
          status?: Database["public"]["Enums"]["finding_status"]
          toegewezen_beoordelaar?: string | null
          toelichting?: string | null
          type_afwijking?: Database["public"]["Enums"]["afwijking_type"] | null
          upload_vereist?: boolean
          zichtbaar_voor_adviseur?: boolean
        }
        Update: {
          afwijking_kleiner_1pct?: boolean
          beoordeling?: Database["public"]["Enums"]["beoordeling_type"] | null
          concept_beoordeling?: Json | null
          concept_reactie?: Json | null
          controlepunt?: string
          created_at?: string
          deadline?: string | null
          deel?: number
          eigenaar_beoordeling?:
            | Database["public"]["Enums"]["eigenaar_type"]
            | null
          goedgekeurd_op?: string | null
          id?: string
          onderdeel?: string
          project_id?: string
          status?: Database["public"]["Enums"]["finding_status"]
          toegewezen_beoordelaar?: string | null
          toelichting?: string | null
          type_afwijking?: Database["public"]["Enums"]["afwijking_type"] | null
          upload_vereist?: boolean
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
          {
            foreignKeyName: "findings_toegewezen_beoordelaar_fkey"
            columns: ["toegewezen_beoordelaar"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          afzender_id: string
          bericht: string
          bijlage_pad: string | null
          datum: string
          finding_id: string
          id: string
        }
        Insert: {
          afzender_id: string
          bericht: string
          bijlage_pad?: string | null
          datum?: string
          finding_id: string
          id?: string
        }
        Update: {
          afzender_id?: string
          bericht?: string
          bijlage_pad?: string | null
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
      modules: {
        Row: {
          actief: boolean
          beschrijving: string | null
          code: string
          created_at: string
          id: string
          naam: string
        }
        Insert: {
          actief?: boolean
          beschrijving?: string | null
          code: string
          created_at?: string
          id?: string
          naam: string
        }
        Update: {
          actief?: boolean
          beschrijving?: string | null
          code?: string
          created_at?: string
          id?: string
          naam?: string
        }
        Relationships: []
      }
      notificaties: {
        Row: {
          bericht: string
          created_at: string
          gelezen: boolean
          id: string
          user_id: string
        }
        Insert: {
          bericht: string
          created_at?: string
          gelezen?: boolean
          id?: string
          user_id: string
        }
        Update: {
          bericht?: string
          created_at?: string
          gelezen?: boolean
          id?: string
          user_id?: string
        }
        Relationships: []
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
      project_uitdraai: {
        Row: {
          bestand_pad: string | null
          bestandsnaam: string
          created_at: string
          extracted_data: Json | null
          id: string
          project_id: string
          status: string
          uploaded_by: string | null
        }
        Insert: {
          bestand_pad?: string | null
          bestandsnaam: string
          created_at?: string
          extracted_data?: Json | null
          id?: string
          project_id: string
          status?: string
          uploaded_by?: string | null
        }
        Update: {
          bestand_pad?: string | null
          bestandsnaam?: string
          created_at?: string
          extracted_data?: Json | null
          id?: string
          project_id?: string
          status?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_uitdraai_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_uitdraai_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          aangemaakt_door: string
          adviseur_id: string | null
          audit_categorie: Database["public"]["Enums"]["audit_categorie"]
          audit_soort: Database["public"]["Enums"]["audit_soort"]
          datum_aangemaakt: string
          ep2_beoordeling: string | null
          ep2_eindwaarde: number | null
          ep2_startwaarde: number | null
          gearchiveerd_op: string | null
          id: string
          is_omgevingsvergunning: boolean
          prioriteit: boolean
          projectnaam: string
          reactie_deadline: string | null
          reminder_overdue_1w_sent: boolean
          reminder_overdue_2w_sent: boolean
          reminder_overdue_3w_sent: boolean
          reminder_pre_sent: boolean
          status: Database["public"]["Enums"]["project_status"]
          toegewezen_aan: string | null
          toegewezen_op: string | null
          toelatingsaudit: boolean
          toewijzing: Database["public"]["Enums"]["toewijzing_type"]
        }
        Insert: {
          aangemaakt_door: string
          adviseur_id?: string | null
          audit_categorie?: Database["public"]["Enums"]["audit_categorie"]
          audit_soort?: Database["public"]["Enums"]["audit_soort"]
          datum_aangemaakt?: string
          ep2_beoordeling?: string | null
          ep2_eindwaarde?: number | null
          ep2_startwaarde?: number | null
          gearchiveerd_op?: string | null
          id?: string
          is_omgevingsvergunning?: boolean
          prioriteit?: boolean
          projectnaam: string
          reactie_deadline?: string | null
          reminder_overdue_1w_sent?: boolean
          reminder_overdue_2w_sent?: boolean
          reminder_overdue_3w_sent?: boolean
          reminder_pre_sent?: boolean
          status?: Database["public"]["Enums"]["project_status"]
          toegewezen_aan?: string | null
          toegewezen_op?: string | null
          toelatingsaudit?: boolean
          toewijzing?: Database["public"]["Enums"]["toewijzing_type"]
        }
        Update: {
          aangemaakt_door?: string
          adviseur_id?: string | null
          audit_categorie?: Database["public"]["Enums"]["audit_categorie"]
          audit_soort?: Database["public"]["Enums"]["audit_soort"]
          datum_aangemaakt?: string
          ep2_beoordeling?: string | null
          ep2_eindwaarde?: number | null
          ep2_startwaarde?: number | null
          gearchiveerd_op?: string | null
          id?: string
          is_omgevingsvergunning?: boolean
          prioriteit?: boolean
          projectnaam?: string
          reactie_deadline?: string | null
          reminder_overdue_1w_sent?: boolean
          reminder_overdue_2w_sent?: boolean
          reminder_overdue_3w_sent?: boolean
          reminder_pre_sent?: boolean
          status?: Database["public"]["Enums"]["project_status"]
          toegewezen_aan?: string | null
          toegewezen_op?: string | null
          toelatingsaudit?: boolean
          toewijzing?: Database["public"]["Enums"]["toewijzing_type"]
        }
        Relationships: [
          {
            foreignKeyName: "projects_adviseur_id_fkey"
            columns: ["adviseur_id"]
            isOneToOne: false
            referencedRelation: "adviseurs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_toegewezen_aan_fkey"
            columns: ["toegewezen_aan"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      sectoren: {
        Row: {
          actief: boolean
          code: string
          created_at: string
          id: string
          naam: string
        }
        Insert: {
          actief?: boolean
          code: string
          created_at?: string
          id?: string
          naam: string
        }
        Update: {
          actief?: boolean
          code?: string
          created_at?: string
          id?: string
          naam?: string
        }
        Relationships: []
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      user_audit_categorieen: {
        Row: {
          audit_categorie: Database["public"]["Enums"]["audit_categorie"]
          id: string
          user_id: string
        }
        Insert: {
          audit_categorie: Database["public"]["Enums"]["audit_categorie"]
          id?: string
          user_id: string
        }
        Update: {
          audit_categorie?: Database["public"]["Enums"]["audit_categorie"]
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_audit_categorieen_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
      claim_project: {
        Args: { _project_id: string; _user_id: string }
        Returns: boolean
      }
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      get_adviseur_aandachtspunten: {
        Args: { _adviseur_id: string; _exclude_project_id: string }
        Returns: {
          aantal: number
          controlepunt: string
          onderdeel: string
        }[]
      }
      has_any_role: {
        Args: { _roles: Database["public"]["Enums"]["app_role"][] }
        Returns: boolean
      }
      has_role: {
        Args: { _role: Database["public"]["Enums"]["app_role"] }
        Returns: boolean
      }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
    }
    Enums: {
      afwijking_type: "kritiek" | "niet_kritiek"
      app_role: "beheer" | "tekenaar" | "auditor" | "ep_adviseur"
      audit_categorie: "EPW-B" | "EPW-D" | "EPU-B" | "EPU-D" | "MWA-B" | "MWA-U"
      audit_soort: "dossieraudit" | "projectaudit"
      beoordeling_type: "goed" | "niet_goed" | "opmerking"
      eigenaar_type: "tekenaar" | "auditor"
      finding_status:
        | "open"
        | "reactie_ontvangen"
        | "gesloten"
        | "reactie_goedgekeurd"
      project_status:
        | "geselecteerd"
        | "deel1_bezig"
        | "wacht_op_deel2"
        | "afgerond"
        | "reactie_open"
        | "gesloten"
        | "nog_niet_begonnen"
        | "deel1_afgerond"
        | "deel2_bezig"
        | "wacht_op_reactie"
      toewijzing_type: "specifiek" | "pool"
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
      beoordeling_type: ["goed", "niet_goed", "opmerking"],
      eigenaar_type: ["tekenaar", "auditor"],
      finding_status: [
        "open",
        "reactie_ontvangen",
        "gesloten",
        "reactie_goedgekeurd",
      ],
      project_status: [
        "geselecteerd",
        "deel1_bezig",
        "wacht_op_deel2",
        "afgerond",
        "reactie_open",
        "gesloten",
        "nog_niet_begonnen",
        "deel1_afgerond",
        "deel2_bezig",
        "wacht_op_reactie",
      ],
      toewijzing_type: ["specifiek", "pool"],
    },
  },
} as const
