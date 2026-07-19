export type UserRole = "admin" | "editor" | "viewer";
export type UserStatus = "pending" | "approved" | "rejected";
export type AiProvider = "openai" | "anthropic" | "google";
export type PromptCategory = "conversa" | "mensagem" | "imagem" | "email";
export type Platform = "whatsapp" | "instagram" | "crm";
export type EngagementStatus = "rascunho" | "aprovada" | "enviada";
export type EngagementResult = "funcionou" | "nao_funcionou" | null;
export type EmailStatus = "rascunho" | "pronto" | "enviado";
export type AiModule = "conversa" | "mensagem" | "imagem" | "email";
export type ImageContextType = "dinamica_slot" | "livre_engagement" | "x1_message" | "email";
export type ImageAspectRatio = "1:1" | "3:2" | "4:3" | "9:16" | "16:9";
export type ImageQuality = "low" | "medium" | "high";

export interface ConversationMessage {
  sender: "left" | "right";
  text: string;
  time: string;
  read_status?: "sent" | "delivered" | "read";
  image_url?: string | null;
}

export type TradingProduct = "pepe" | "live" | "copy";
export type TradingWindow = "dia" | "semana" | "mes" | "total";
export type StudentSegment = "iniciante" | "avancado" | "inativo";

export interface VagasConfig {
  mode?: "tiered" | "single" | "none";
  turbo?: number;
  suprema?: number;
  lendaria?: number;
  galactica?: number;
  ignicao?: number;
  curva?: "linear" | "agressiva" | "suave";
}
export type RotatingBanks = Record<string, string[]>;
export type ExtraVars = Record<string, string>;
export interface Top5Config {
  enabled: boolean;
  values: number[];
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          role: UserRole;
          status: UserStatus;
          created_at: string;
          last_active_at: string | null;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          role?: UserRole;
          status?: UserStatus;
          created_at?: string;
          last_active_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
      ai_credentials: {
        Row: {
          id: string;
          provider: AiProvider;
          encrypted_key: string;
          is_valid: boolean;
          last_validated_at: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["ai_credentials"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["ai_credentials"]["Insert"]>;
        Relationships: [];
      };
      prompts: {
        Row: {
          id: string;
          title: string;
          category: PromptCategory;
          content: string;
          tags: string[] | null;
          usage_count: number;
          created_by: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["prompts"]["Row"], "id" | "created_at" | "usage_count"> & {
          id?: string;
          created_at?: string;
          usage_count?: number;
        };
        Update: Partial<Database["public"]["Tables"]["prompts"]["Insert"]>;
        Relationships: [];
      };
      fake_conversations: {
        Row: {
          id: string;
          platform: Platform;
          title: string | null;
          contact_name: string | null;
          contact_avatar_url: string | null;
          contact_status: string | null;
          messages: ConversationMessage[];
          prompt_id: string | null;
          tema: string | null;
          export_format: string | null;
          crm_instance_name: string | null;
          crm_assignee_name: string | null;
          crm_assignee_avatar_url: string | null;
          crm_status: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["fake_conversations"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["fake_conversations"]["Insert"]>;
        Relationships: [];
      };
      engagement_messages: {
        Row: {
          id: string;
          scheduled_date: string;
          text_prompt_id: string | null;
          image_prompt_id: string | null;
          generated_text: string | null;
          generated_image_url: string | null;
          status: EngagementStatus;
          result: EngagementResult;
          notes: string | null;
          tema: string | null;
          news_reference: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["engagement_messages"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["engagement_messages"]["Insert"]>;
        Relationships: [];
      };
      email_campaigns: {
        Row: {
          id: string;
          scheduled_date: string;
          subject: string | null;
          preview_text: string | null;
          body_html: string | null;
          news_reference: string | null;
          prompt_id: string | null;
          tema: string | null;
          status: EmailStatus;
          created_by: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["email_campaigns"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["email_campaigns"]["Insert"]>;
        Relationships: [];
      };
      ai_usage_log: {
        Row: {
          id: string;
          module: AiModule;
          provider: string | null;
          model: string | null;
          tokens_used: number | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["ai_usage_log"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["ai_usage_log"]["Insert"]>;
        Relationships: [];
      };
      ai_provider_settings: {
        Row: {
          module: AiModule;
          provider: AiProvider;
          model: string;
          updated_by: string | null;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["ai_provider_settings"]["Row"], "updated_at"> & {
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["ai_provider_settings"]["Insert"]>;
        Relationships: [];
      };
      trading_performance_stats: {
        Row: {
          id: string;
          product: TradingProduct;
          time_window: TradingWindow;
          wins: number;
          losses: number;
          rendimento_pct: number | null;
          updated_by: string | null;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["trading_performance_stats"]["Row"], "id" | "updated_at"> & {
          id?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["trading_performance_stats"]["Insert"]>;
        Relationships: [];
      };
      trading_config: {
        Row: {
          id: number;
          cotacao: number;
          payout_copy: number;
          payout_pepe_live: number;
          banca_copy: number;
          entrada_pepe: number;
          entrada_live: number;
          updated_by: string | null;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["trading_config"]["Row"], "updated_at"> & {
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["trading_config"]["Insert"]>;
        Relationships: [];
      };
      message_dynamics: {
        Row: {
          id: string;
          slug: string;
          name: string;
          icon: string | null;
          subtitle: string | null;
          rules: string[];
          vagas_config: VagasConfig;
          rotating_banks: RotatingBanks;
          extra_vars: ExtraVars;
          top5_config: Top5Config | null;
          active: boolean;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["message_dynamics"]["Row"], "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["message_dynamics"]["Insert"]>;
        Relationships: [];
      };
      message_dynamic_slots: {
        Row: {
          id: string;
          dynamic_id: string;
          position: number;
          msg_key: string;
          time_label: string | null;
          role_label: string | null;
          cta_tags: string[];
          template: string;
          media_suggestion: string | null;
          expert_hint: string | null;
          has_fonte_selector: boolean;
          fonte_default: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["message_dynamic_slots"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["message_dynamic_slots"]["Insert"]>;
        Relationships: [];
      };
      daily_dynamic_selection: {
        Row: {
          id: string;
          scheduled_date: string;
          dynamic_id: string | null;
          fonte_overrides: Record<string, string>;
          text_overrides: Record<string, string>;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["daily_dynamic_selection"]["Row"], "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["daily_dynamic_selection"]["Insert"]>;
        Relationships: [];
      };
      direct_messages: {
        Row: {
          id: string;
          scheduled_date: string;
          student_segment: StudentSegment | null;
          text_prompt_id: string | null;
          image_prompt_id: string | null;
          generated_text: string | null;
          generated_image_url: string | null;
          status: EngagementStatus;
          result: EngagementResult;
          notes: string | null;
          tema: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["direct_messages"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["direct_messages"]["Insert"]>;
        Relationships: [];
      };
      generated_images: {
        Row: {
          id: string;
          context_type: ImageContextType;
          context_id: string;
          prompt: string;
          prompt_id: string | null;
          image_url: string;
          provider: string;
          model: string;
          format: ImageAspectRatio;
          quality: ImageQuality;
          created_by: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["generated_images"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["generated_images"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      admin_list_users: {
        Args: Record<string, never>;
        Returns: {
          id: string;
          email: string | null;
          full_name: string | null;
          role: UserRole;
          status: UserStatus;
          created_at: string;
        }[];
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
