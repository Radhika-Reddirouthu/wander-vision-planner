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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      group_polls: {
        Row: {
          budget: string
          created_at: string
          depart_date: string
          destination: string
          expires_at: string
          google_form_id: string | null
          google_form_url: string | null
          group_type: string
          id: string
          organizer_email: string
          poll_status: string | null
          return_date: string
          trip_type: string
          updated_at: string
        }
        Insert: {
          budget: string
          created_at?: string
          depart_date: string
          destination: string
          expires_at?: string
          google_form_id?: string | null
          google_form_url?: string | null
          group_type: string
          id?: string
          organizer_email: string
          poll_status?: string | null
          return_date: string
          trip_type: string
          updated_at?: string
        }
        Update: {
          budget?: string
          created_at?: string
          depart_date?: string
          destination?: string
          expires_at?: string
          google_form_id?: string | null
          google_form_url?: string | null
          group_type?: string
          id?: string
          organizer_email?: string
          poll_status?: string | null
          return_date?: string
          trip_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      poll_members: {
        Row: {
          email: string
          has_responded: boolean | null
          id: string
          invited_at: string
          poll_id: string
          responded_at: string | null
        }
        Insert: {
          email: string
          has_responded?: boolean | null
          id?: string
          invited_at?: string
          poll_id: string
          responded_at?: string | null
        }
        Update: {
          email?: string
          has_responded?: boolean | null
          id?: string
          invited_at?: string
          poll_id?: string
          responded_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "poll_members_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "group_polls"
            referencedColumns: ["id"]
          },
        ]
      }
      poll_questions: {
        Row: {
          allow_public_access: boolean | null
          category: string
          created_at: string
          id: string
          options: Json | null
          poll_id: string
          question_text: string
          question_type: string
        }
        Insert: {
          allow_public_access?: boolean | null
          category: string
          created_at?: string
          id?: string
          options?: Json | null
          poll_id: string
          question_text: string
          question_type: string
        }
        Update: {
          allow_public_access?: boolean | null
          category?: string
          created_at?: string
          id?: string
          options?: Json | null
          poll_id?: string
          question_text?: string
          question_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "poll_questions_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "group_polls"
            referencedColumns: ["id"]
          },
        ]
      }
      poll_responses: {
        Row: {
          id: string
          poll_id: string
          question_id: string
          responder_email: string
          response_value: string
          submitted_at: string
        }
        Insert: {
          id?: string
          poll_id: string
          question_id: string
          responder_email: string
          response_value: string
          submitted_at?: string
        }
        Update: {
          id?: string
          poll_id?: string
          question_id?: string
          responder_email?: string
          response_value?: string
          submitted_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "poll_responses_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "group_polls"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "poll_responses_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "poll_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      poll_results: {
        Row: {
          calculated_at: string
          category: string
          id: string
          majority_choice: string | null
          poll_id: string
          result_summary: Json
          vote_distribution: Json | null
        }
        Insert: {
          calculated_at?: string
          category: string
          id?: string
          majority_choice?: string | null
          poll_id: string
          result_summary: Json
          vote_distribution?: Json | null
        }
        Update: {
          calculated_at?: string
          category?: string
          id?: string
          majority_choice?: string | null
          poll_id?: string
          result_summary?: Json
          vote_distribution?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "poll_results_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "group_polls"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          accommodation_style: string | null
          active_poll_id: string | null
          activity_level: string | null
          adventure_seeking: string | null
          budget_flexibility: string | null
          created_at: string
          cultural_interest: string | null
          display_name: string | null
          draft_trip_data: Json | null
          email: string
          environment_preference: string | null
          food_adventure_level: string | null
          group_dynamics: string | null
          id: string
          last_planning_step: string | null
          nightlife_preference: string | null
          onboarding_completed: boolean
          pace_preference: string | null
          planning_style: string | null
          shopping_interest: string | null
          social_preference: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          accommodation_style?: string | null
          active_poll_id?: string | null
          activity_level?: string | null
          adventure_seeking?: string | null
          budget_flexibility?: string | null
          created_at?: string
          cultural_interest?: string | null
          display_name?: string | null
          draft_trip_data?: Json | null
          email: string
          environment_preference?: string | null
          food_adventure_level?: string | null
          group_dynamics?: string | null
          id?: string
          last_planning_step?: string | null
          nightlife_preference?: string | null
          onboarding_completed?: boolean
          pace_preference?: string | null
          planning_style?: string | null
          shopping_interest?: string | null
          social_preference?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          accommodation_style?: string | null
          active_poll_id?: string | null
          activity_level?: string | null
          adventure_seeking?: string | null
          budget_flexibility?: string | null
          created_at?: string
          cultural_interest?: string | null
          display_name?: string | null
          draft_trip_data?: Json | null
          email?: string
          environment_preference?: string | null
          food_adventure_level?: string | null
          group_dynamics?: string | null
          id?: string
          last_planning_step?: string | null
          nightlife_preference?: string | null
          onboarding_completed?: boolean
          pace_preference?: string | null
          planning_style?: string | null
          shopping_interest?: string | null
          social_preference?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_poll_member_or_organizer: {
        Args: { poll_uuid: string }
        Returns: boolean
      }
      user_can_access_poll: {
        Args: { poll_uuid: string }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
