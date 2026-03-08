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
      app_settings: {
        Row: {
          id: string
          setting_key: string
          setting_value_json: Json
          updated_at: string
        }
        Insert: {
          id?: string
          setting_key: string
          setting_value_json?: Json
          updated_at?: string
        }
        Update: {
          id?: string
          setting_key?: string
          setting_value_json?: Json
          updated_at?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          actor_role: string | null
          actor_user_id: string | null
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          payload_summary: Json | null
        }
        Insert: {
          action: string
          actor_role?: string | null
          actor_user_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          payload_summary?: Json | null
        }
        Update: {
          action?: string
          actor_role?: string | null
          actor_user_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          payload_summary?: Json | null
        }
        Relationships: []
      }
      meetings: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          status: string
          title: string
          topic: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          status?: string
          title: string
          topic?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          status?: string
          title?: string
          topic?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      model_providers: {
        Row: {
          api_base_url: string | null
          created_at: string
          display_name: string
          enabled: boolean
          id: string
          notes: string | null
          provider_key: string
          updated_at: string
        }
        Insert: {
          api_base_url?: string | null
          created_at?: string
          display_name: string
          enabled?: boolean
          id?: string
          notes?: string | null
          provider_key: string
          updated_at?: string
        }
        Update: {
          api_base_url?: string | null
          created_at?: string
          display_name?: string
          enabled?: boolean
          id?: string
          notes?: string | null
          provider_key?: string
          updated_at?: string
        }
        Relationships: []
      }
      models: {
        Row: {
          api_model_name: string
          color_tag: string | null
          created_at: string
          display_name: string
          enabled: boolean
          icon_name: string | null
          id: string
          max_tokens_default: number | null
          model_key: string
          provider_id: string
          role_preset: string | null
          seat_type: string | null
          sort_order: number
          temperature_default: number | null
          updated_at: string
        }
        Insert: {
          api_model_name: string
          color_tag?: string | null
          created_at?: string
          display_name: string
          enabled?: boolean
          icon_name?: string | null
          id?: string
          max_tokens_default?: number | null
          model_key: string
          provider_id: string
          role_preset?: string | null
          seat_type?: string | null
          sort_order?: number
          temperature_default?: number | null
          updated_at?: string
        }
        Update: {
          api_model_name?: string
          color_tag?: string | null
          created_at?: string
          display_name?: string
          enabled?: boolean
          icon_name?: string | null
          id?: string
          max_tokens_default?: number | null
          model_key?: string
          provider_id?: string
          role_preset?: string | null
          seat_type?: string | null
          sort_order?: number
          temperature_default?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "models_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "model_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      prompt_templates: {
        Row: {
          content: string
          created_at: string
          enabled: boolean
          id: string
          name: string
          template_type: string
          updated_at: string
          version: number
        }
        Insert: {
          content: string
          created_at?: string
          enabled?: boolean
          id?: string
          name: string
          template_type?: string
          updated_at?: string
          version?: number
        }
        Update: {
          content?: string
          created_at?: string
          enabled?: boolean
          id?: string
          name?: string
          template_type?: string
          updated_at?: string
          version?: number
        }
        Relationships: []
      }
      run_participants: {
        Row: {
          enabled: boolean
          id: string
          model_id: string
          role_in_run: string
          run_id: string
          seat_order: number
        }
        Insert: {
          enabled?: boolean
          id?: string
          model_id: string
          role_in_run?: string
          run_id: string
          seat_order?: number
        }
        Update: {
          enabled?: boolean
          id?: string
          model_id?: string
          role_in_run?: string
          run_id?: string
          seat_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "run_participants_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "models"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "run_participants_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "runs"
            referencedColumns: ["id"]
          },
        ]
      }
      runs: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          mode: string
          status: string
          system_prompt: string | null
          task_prompt: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          mode?: string
          status?: string
          system_prompt?: string | null
          task_prompt?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          mode?: string
          status?: string
          system_prompt?: string | null
          task_prompt?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      steps: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          input_text: string | null
          latency_ms: number | null
          model_id: string | null
          model_name: string | null
          output_text: string | null
          provider: string | null
          raw_payload_json: Json | null
          run_id: string
          step_type: string
          token_usage_json: Json | null
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          input_text?: string | null
          latency_ms?: number | null
          model_id?: string | null
          model_name?: string | null
          output_text?: string | null
          provider?: string | null
          raw_payload_json?: Json | null
          run_id: string
          step_type?: string
          token_usage_json?: Json | null
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          input_text?: string | null
          latency_ms?: number | null
          model_id?: string | null
          model_name?: string | null
          output_text?: string | null
          provider?: string | null
          raw_payload_json?: Json | null
          run_id?: string
          step_type?: string
          token_usage_json?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "steps_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "models"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "steps_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "runs"
            referencedColumns: ["id"]
          },
        ]
      }
      turns: {
        Row: {
          agenda_text: string | null
          created_at: string
          id: string
          meeting_id: string
          moderator_prompt: string | null
          summary_text: string | null
          turn_number: number
        }
        Insert: {
          agenda_text?: string | null
          created_at?: string
          id?: string
          meeting_id: string
          moderator_prompt?: string | null
          summary_text?: string | null
          turn_number?: number
        }
        Update: {
          agenda_text?: string | null
          created_at?: string
          id?: string
          meeting_id?: string
          moderator_prompt?: string | null
          summary_text?: string | null
          turn_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "turns_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      utterances: {
        Row: {
          created_at: string
          id: string
          meeting_id: string
          model_id: string | null
          reply_to_utterance_id: string | null
          speaker_name: string
          speaker_type: string
          turn_id: string | null
          utterance_text: string
        }
        Insert: {
          created_at?: string
          id?: string
          meeting_id: string
          model_id?: string | null
          reply_to_utterance_id?: string | null
          speaker_name: string
          speaker_type?: string
          turn_id?: string | null
          utterance_text: string
        }
        Update: {
          created_at?: string
          id?: string
          meeting_id?: string
          model_id?: string | null
          reply_to_utterance_id?: string | null
          speaker_name?: string
          speaker_type?: string
          turn_id?: string | null
          utterance_text?: string
        }
        Relationships: [
          {
            foreignKeyName: "utterances_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "utterances_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "models"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "utterances_reply_to_utterance_id_fkey"
            columns: ["reply_to_utterance_id"]
            isOneToOne: false
            referencedRelation: "utterances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "utterances_turn_id_fkey"
            columns: ["turn_id"]
            isOneToOne: false
            referencedRelation: "turns"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_admin_role: { Args: { _user_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "founder" | "superadmin" | "analyst" | "viewer"
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
      app_role: ["founder", "superadmin", "analyst", "viewer"],
    },
  },
} as const
