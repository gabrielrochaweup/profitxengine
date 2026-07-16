export type UserRole = "admin" | "editor" | "viewer";
export type AiProvider = "openai" | "anthropic";
export type PromptCategory = "conversa" | "mensagem" | "imagem" | "email";
export type Platform = "whatsapp" | "instagram";
export type EngagementStatus = "rascunho" | "aprovada" | "enviada";
export type EngagementResult = "funcionou" | "nao_funcionou" | null;
export type EmailStatus = "rascunho" | "pronto" | "enviado";
export type AiModule = "conversa" | "mensagem" | "imagem" | "email";

export interface ConversationMessage {
  sender: "left" | "right";
  text: string;
  time: string;
  read_status?: "sent" | "delivered" | "read";
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          role: UserRole;
          created_at: string;
          last_active_at: string | null;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          role?: UserRole;
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
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
