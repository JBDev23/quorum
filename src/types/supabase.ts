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
    PostgrestVersion: "14.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      billing_webhook_events: {
        Row: {
          app_user_id: string | null
          event_type: string | null
          id: string
          processed_at: string
        }
        Insert: {
          app_user_id?: string | null
          event_type?: string | null
          id: string
          processed_at?: string
        }
        Update: {
          app_user_id?: string | null
          event_type?: string | null
          id?: string
          processed_at?: string
        }
        Relationships: []
      }
      cast_votes: {
        Row: {
          cast_at: string
          is_blank: boolean
          option_id: string | null
          poll_id: string
          receipt_hash: string
        }
        Insert: {
          cast_at?: string
          is_blank?: boolean
          option_id?: string | null
          poll_id: string
          receipt_hash: string
        }
        Update: {
          cast_at?: string
          is_blank?: boolean
          option_id?: string | null
          poll_id?: string
          receipt_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "cast_votes_option_id_fkey"
            columns: ["option_id"]
            isOneToOne: false
            referencedRelation: "poll_options"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cast_votes_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "polls"
            referencedColumns: ["id"]
          },
        ]
      }
      device_push_tokens: {
        Row: {
          expo_push_token: string
          id: string
          platform: string
          updated_at: string
          user_id: string
        }
        Insert: {
          expo_push_token: string
          id?: string
          platform: string
          updated_at?: string
          user_id: string
        }
        Update: {
          expo_push_token?: string
          id?: string
          platform?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "device_push_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      group_members: {
        Row: {
          group_id: string
          joined_at: string | null
          role: Database["public"]["Enums"]["group_role"]
          user_id: string
        }
        Insert: {
          group_id: string
          joined_at?: string | null
          role?: Database["public"]["Enums"]["group_role"]
          user_id: string
        }
        Update: {
          group_id?: string
          joined_at?: string | null
          role?: Database["public"]["Enums"]["group_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      groups: {
        Row: {
          created_at: string | null
          creator_id: string
          id: string
          invite_pin: string
          name: string
        }
        Insert: {
          created_at?: string | null
          creator_id: string
          id?: string
          invite_pin: string
          name: string
        }
        Update: {
          created_at?: string | null
          creator_id?: string
          id?: string
          invite_pin?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "groups_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_attendances: {
        Row: {
          accredited_at: string
          meeting_id: string
          user_id: string
        }
        Insert: {
          accredited_at?: string
          meeting_id: string
          user_id: string
        }
        Update: {
          accredited_at?: string
          meeting_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meeting_attendances_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_attendances_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_delegations: {
        Row: {
          created_at: string
          delegate_id: string
          delegator_id: string
          id: string
          meeting_id: string
        }
        Insert: {
          created_at?: string
          delegate_id: string
          delegator_id: string
          id?: string
          meeting_id: string
        }
        Update: {
          created_at?: string
          delegate_id?: string
          delegator_id?: string
          id?: string
          meeting_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meeting_delegations_delegate_id_fkey"
            columns: ["delegate_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_delegations_delegator_id_fkey"
            columns: ["delegator_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_delegations_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      meetings: {
        Row: {
          allow_blank_votes: boolean
          allow_delegations: boolean
          created_at: string | null
          end_date: string | null
          group_id: string
          id: string
          start_date: string
          status: Database["public"]["Enums"]["meeting_status"]
          title: string
        }
        Insert: {
          allow_blank_votes?: boolean
          allow_delegations?: boolean
          created_at?: string | null
          end_date?: string | null
          group_id: string
          id?: string
          start_date?: string
          status?: Database["public"]["Enums"]["meeting_status"]
          title: string
        }
        Update: {
          allow_blank_votes?: boolean
          allow_delegations?: boolean
          created_at?: string | null
          end_date?: string | null
          group_id?: string
          id?: string
          start_date?: string
          status?: Database["public"]["Enums"]["meeting_status"]
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "meetings_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      poll_options: {
        Row: {
          created_at: string | null
          id: string
          poll_id: string
          text: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          poll_id: string
          text: string
        }
        Update: {
          created_at?: string | null
          id?: string
          poll_id?: string
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "poll_options_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "polls"
            referencedColumns: ["id"]
          },
        ]
      }
      poll_participations: {
        Row: {
          poll_id: string
          user_id: string
          voted_at: string
        }
        Insert: {
          poll_id: string
          user_id: string
          voted_at?: string
        }
        Update: {
          poll_id?: string
          user_id?: string
          voted_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "poll_participations_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "polls"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "poll_participations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      polls: {
        Row: {
          created_at: string | null
          id: string
          meeting_id: string
          status: Database["public"]["Enums"]["poll_status"]
          title: string
          type: Database["public"]["Enums"]["poll_type"]
        }
        Insert: {
          created_at?: string | null
          id?: string
          meeting_id: string
          status?: Database["public"]["Enums"]["poll_status"]
          title: string
          type: Database["public"]["Enums"]["poll_type"]
        }
        Update: {
          created_at?: string | null
          id?: string
          meeting_id?: string
          status?: Database["public"]["Enums"]["poll_status"]
          title?: string
          type?: Database["public"]["Enums"]["poll_type"]
        }
        Relationships: [
          {
            foreignKeyName: "polls_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          first_name: string | null
          id: string
          is_premium: boolean
          last_name: string | null
          notify_doors_open: boolean
          notify_new_meetings: boolean
          notify_polls: boolean
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          first_name?: string | null
          id: string
          is_premium?: boolean
          last_name?: string | null
          notify_doors_open?: boolean
          notify_new_meetings?: boolean
          notify_polls?: boolean
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          first_name?: string | null
          id?: string
          is_premium?: boolean
          last_name?: string | null
          notify_doors_open?: boolean
          notify_new_meetings?: boolean
          notify_polls?: boolean
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accredit_attendee: {
        Args: { p_meeting_id: string; p_user_id: string }
        Returns: undefined
      }
      cast_ballot: {
        Args: {
          p_delegator_id?: string
          p_is_blank?: boolean
          p_option_id?: string
          p_poll_id: string
          p_receipt_hash: string
        }
        Returns: string
      }
      create_group: { Args: { p_name: string }; Returns: Json }
      create_meeting_delegation: {
        Args: { p_delegate_id: string; p_meeting_id: string }
        Returns: undefined
      }
      is_group_member: { Args: { p_group_id: string }; Returns: boolean }
      is_group_member_user: {
        Args: { p_group_id: string; p_user_id: string }
        Returns: boolean
      }
      is_group_organizer: { Args: { p_group_id: string }; Returns: boolean }
      is_meeting_attendee: { Args: { p_meeting_id: string }; Returns: boolean }
      is_meeting_member: { Args: { p_meeting_id: string }; Returns: boolean }
      is_meeting_organizer: { Args: { p_meeting_id: string }; Returns: boolean }
      is_poll_attendee: { Args: { p_poll_id: string }; Returns: boolean }
      is_poll_member: { Args: { p_poll_id: string }; Returns: boolean }
      is_poll_organizer: { Args: { p_poll_id: string }; Returns: boolean }
      join_group: {
        Args: { p_group_id: string; p_pin: string }
        Returns: string
      }
      join_group_by_pin: { Args: { p_pin: string }; Returns: Json }
      revoke_meeting_delegation: {
        Args: { p_meeting_id: string }
        Returns: undefined
      }
      set_meeting_allow_delegations: {
        Args: { p_allow: boolean; p_meeting_id: string }
        Returns: undefined
      }
    }
    Enums: {
      group_role: "organizer" | "participant"
      meeting_status:
        | "draft"
        | "scheduled"
        | "accreditation"
        | "active"
        | "closed"
      poll_status: "draft" | "active" | "closed"
      poll_type: "yes_no" | "multiple_choice"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      group_role: ["organizer", "participant"],
      meeting_status: [
        "draft",
        "scheduled",
        "accreditation",
        "active",
        "closed",
      ],
      poll_status: ["draft", "active", "closed"],
      poll_type: ["yes_no", "multiple_choice"],
    },
  },
} as const
