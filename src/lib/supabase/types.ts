export type UserRole = "admin" | "editor" | "viewer";
export type UserStatus = "pending" | "approved" | "rejected";
export type AiProvider = "openai" | "anthropic" | "google";
export type Platform = "whatsapp" | "instagram" | "crm";
export type EngagementStatus = "rascunho" | "aprovada" | "enviada";
export type EngagementResult = "funcionou" | "nao_funcionou" | null;
export type EmailStatus = "rascunho" | "pronto" | "enviado";
export type AiModule = "conversa" | "mensagem" | "imagem" | "email";
export type ImageContextType = "dinamica_slot" | "livre_engagement" | "x1_message" | "email" | "criativo" | "carrossel";
export type ImageAspectRatio = "1:1" | "3:2" | "4:3" | "9:16" | "16:9";
export type ImageQuality = "low" | "medium" | "high";
export type PostDisplayStyle = "paragrafo" | "titulo_grande";
export type PostFormat = "quadrado" | "feed" | "stories";
export type PostTemplate = "twitter" | "profitx";
export type PostAccent = "dourado" | "azul" | "verde";
export interface CarouselFrame {
  backgroundImageUrl: string | null;
}

export interface DynamicSnapshotSlot {
  msgKey: string;
  timeLabel: string | null;
  template: string;
  position: number;
}

export interface ConversationMessage {
  sender: "left" | "right";
  text: string;
  time: string;
  read_status?: "sent" | "delivered" | "read";
  image_url?: string | null;
}

// Idiomas gerados automaticamente pra cada conversa fake — "br" é o idioma
// principal (fica nas colunas antigas contact_name/contact_status/messages,
// pra não quebrar conversas salvas antes dessa feature); "us"/"es" ficam
// dentro da coluna translations.
export const CLIENT_LOCALES = ["br", "us", "es"] as const;
export type ClientLocale = (typeof CLIENT_LOCALES)[number];
export const CLIENT_LOCALE_LABELS: Record<ClientLocale, string> = {
  br: "Português",
  us: "Inglês",
  es: "Espanhol",
};
// Versão curta pra caber junto de outros controles na mesma linha (ex: carrossel do preview).
export const CLIENT_LOCALE_SHORT_LABELS: Record<ClientLocale, string> = {
  br: "PT",
  us: "EN",
  es: "ES",
};

export interface ConversationTranslation {
  contact_name: string | null;
  contact_status: string | null;
  messages: ConversationMessage[];
}
export type ConversationTranslations = Partial<Record<Extract<ClientLocale, "us" | "es">, ConversationTranslation>>;

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
          product_id: string;
          title: string;
          category_id: string;
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
      prompt_categories: {
        Row: {
          id: string;
          product_id: string;
          slug: string | null;
          name: string;
          position: number;
          created_by: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["prompt_categories"]["Row"], "id" | "created_at" | "slug"> & {
          id?: string;
          created_at?: string;
          slug?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["prompt_categories"]["Insert"]>;
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
          translations: ConversationTranslations | null;
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
          acerto_pct: number;
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
      top5_stats: {
        Row: {
          id: number;
          enabled: boolean;
          values: number[];
          updated_by: string | null;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["top5_stats"]["Row"], "updated_at"> & {
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["top5_stats"]["Insert"]>;
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
          needs_realtime_update: boolean;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["message_dynamic_slots"]["Row"], "id" | "created_at" | "needs_realtime_update"> & {
          id?: string;
          created_at?: string;
          needs_realtime_update?: boolean;
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
          concluded: boolean;
          concluded_at: string | null;
          concluded_by: string | null;
          pepe_pessoas: number | null;
          pepe_valor: number | null;
          live_pessoas: number | null;
          live_valor: number | null;
          copy_pessoas: number | null;
          copy_valor: number | null;
          depositos_valor: number | null;
          depositos_qtd: number | null;
          faturamento_bruto: number | null;
          faturamento_liquido: number | null;
          observacoes: string | null;
        };
        Insert: Omit<
          Database["public"]["Tables"]["daily_dynamic_selection"]["Row"],
          | "id"
          | "created_at"
          | "updated_at"
          | "dynamic_id"
          | "fonte_overrides"
          | "text_overrides"
          | "concluded"
          | "concluded_at"
          | "concluded_by"
          | "pepe_pessoas"
          | "pepe_valor"
          | "live_pessoas"
          | "live_valor"
          | "copy_pessoas"
          | "copy_valor"
          | "depositos_valor"
          | "depositos_qtd"
          | "faturamento_bruto"
          | "faturamento_liquido"
          | "observacoes"
        > & {
          id?: string;
          created_at?: string;
          updated_at?: string;
          dynamic_id?: string | null;
          fonte_overrides?: Record<string, string>;
          text_overrides?: Record<string, string>;
          concluded?: boolean;
          concluded_at?: string | null;
          concluded_by?: string | null;
          pepe_pessoas?: number | null;
          pepe_valor?: number | null;
          live_pessoas?: number | null;
          live_valor?: number | null;
          copy_pessoas?: number | null;
          copy_valor?: number | null;
          depositos_valor?: number | null;
          depositos_qtd?: number | null;
          faturamento_bruto?: number | null;
          faturamento_liquido?: number | null;
          observacoes?: string | null;
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
          product_id: string;
          context_type: ImageContextType;
          context_id: string;
          prompt: string;
          prompt_id: string | null;
          image_url: string;
          provider: string;
          model: string;
          format: ImageAspectRatio;
          quality: ImageQuality;
          folder_id: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["generated_images"]["Row"], "id" | "created_at" | "folder_id"> & {
          id?: string;
          created_at?: string;
          folder_id?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["generated_images"]["Insert"]>;
        Relationships: [];
      };
      image_folders: {
        Row: {
          id: string;
          product_id: string;
          name: string;
          position: number;
          parent_id: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["image_folders"]["Row"], "id" | "created_at" | "parent_id"> & {
          id?: string;
          created_at?: string;
          parent_id?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["image_folders"]["Insert"]>;
        Relationships: [];
      };
      image_prompt_templates: {
        Row: {
          id: string;
          product_id: string;
          name: string;
          body: string;
          position: number;
          dynamic_id: string | null;
          msg_key: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["image_prompt_templates"]["Row"], "id" | "created_at" | "dynamic_id" | "msg_key"> & {
          id?: string;
          created_at?: string;
          dynamic_id?: string | null;
          msg_key?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["image_prompt_templates"]["Insert"]>;
        Relationships: [];
      };
      image_prompt_characters: {
        Row: {
          id: string;
          product_id: string;
          name: string;
          body: string;
          position: number;
          created_by: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["image_prompt_characters"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["image_prompt_characters"]["Insert"]>;
        Relationships: [];
      };
      image_prompt_tones: {
        Row: {
          id: string;
          product_id: string;
          name: string;
          body: string;
          position: number;
          created_by: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["image_prompt_tones"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["image_prompt_tones"]["Insert"]>;
        Relationships: [];
      };
      image_prompt_ctas: {
        Row: {
          id: string;
          product_id: string;
          name: string;
          body: string;
          position: number;
          created_by: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["image_prompt_ctas"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["image_prompt_ctas"]["Insert"]>;
        Relationships: [];
      };
      testimonial_prompt_templates: {
        Row: {
          id: string;
          name: string;
          body: string;
          position: number;
          created_by: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["testimonial_prompt_templates"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["testimonial_prompt_templates"]["Insert"]>;
        Relationships: [];
      };
      testimonial_prompt_styles: {
        Row: {
          id: string;
          name: string;
          body: string;
          position: number;
          created_by: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["testimonial_prompt_styles"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["testimonial_prompt_styles"]["Insert"]>;
        Relationships: [];
      };
      testimonial_prompt_variations: {
        Row: {
          id: string;
          name: string;
          body: string;
          position: number;
          created_by: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["testimonial_prompt_variations"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["testimonial_prompt_variations"]["Insert"]>;
        Relationships: [];
      };
      testimonial_prompt_image_variants: {
        Row: {
          id: string;
          name: string;
          body: string;
          position: number;
          created_by: string | null;
          created_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["testimonial_prompt_image_variants"]["Row"],
          "id" | "created_at"
        > & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["testimonial_prompt_image_variants"]["Insert"]>;
        Relationships: [];
      };
      avatar_library: {
        Row: {
          id: string;
          url: string;
          storage_path: string;
          last_used_at: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["avatar_library"]["Row"], "id" | "created_at" | "last_used_at"> & {
          id?: string;
          created_at?: string;
          last_used_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["avatar_library"]["Insert"]>;
        Relationships: [];
      };
      fake_posts: {
        Row: {
          id: string;
          title: string | null;
          author_name: string | null;
          author_handle: string | null;
          author_avatar_url: string | null;
          verified: boolean;
          display_style: PostDisplayStyle;
          format: PostFormat;
          template: PostTemplate;
          body: string | null;
          subtitle: string | null;
          link_card_image_url: string | null;
          link_card_title: string | null;
          link_card_description: string | null;
          profitx_badge_text: string | null;
          profitx_headline_1: string | null;
          profitx_headline_2: string | null;
          profitx_stat_label: string | null;
          profitx_stat_value: string | null;
          profitx_stat_caption: string | null;
          profitx_footer_line1: string | null;
          profitx_footer_line2: string | null;
          profitx_accent: PostAccent;
          prompt_id: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["fake_posts"]["Row"],
          "id" | "created_at" | "verified" | "display_style" | "format" | "template" | "profitx_accent"
        > & {
          id?: string;
          created_at?: string;
          verified?: boolean;
          display_style?: PostDisplayStyle;
          format?: PostFormat;
          template?: PostTemplate;
          profitx_accent?: PostAccent;
        };
        Update: Partial<Database["public"]["Tables"]["fake_posts"]["Insert"]>;
        Relationships: [];
      };
      post_prompt_templates: {
        Row: {
          id: string;
          name: string;
          body: string;
          position: number;
          created_by: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["post_prompt_templates"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["post_prompt_templates"]["Insert"]>;
        Relationships: [];
      };
      fake_carousels: {
        Row: {
          id: string;
          title: string | null;
          format: PostFormat;
          frames: CarouselFrame[];
          prompt_id: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["fake_carousels"]["Row"], "id" | "created_at" | "format" | "frames"> & {
          id?: string;
          created_at?: string;
          format?: PostFormat;
          frames?: CarouselFrame[];
        };
        Update: Partial<Database["public"]["Tables"]["fake_carousels"]["Insert"]>;
        Relationships: [];
      };
      dynamic_snapshots: {
        Row: {
          id: string;
          label: string;
          dynamic_slug: string;
          dynamic_name: string;
          dynamic_icon: string | null;
          rules: string[];
          rotating_banks: RotatingBanks;
          extra_vars: ExtraVars;
          slots: DynamicSnapshotSlot[];
          created_by: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["dynamic_snapshots"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["dynamic_snapshots"]["Insert"]>;
        Relationships: [];
      };
      products: {
        Row: {
          id: string;
          slug: string;
          name: string;
          icon: string | null;
          niche: string | null;
          position: number;
          active: boolean;
          created_by: string | null;
          created_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["products"]["Row"],
          "id" | "created_at" | "position" | "active" | "niche"
        > & {
          id?: string;
          created_at?: string;
          position?: number;
          active?: boolean;
          niche?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["products"]["Insert"]>;
        Relationships: [];
      };
      product_metric_fields: {
        Row: {
          id: string;
          product_id: string;
          label: string;
          unit: "numero" | "moeda";
          position: number;
          created_by: string | null;
          created_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["product_metric_fields"]["Row"],
          "id" | "created_at" | "position" | "unit"
        > & {
          id?: string;
          created_at?: string;
          position?: number;
          unit?: "numero" | "moeda";
        };
        Update: Partial<Database["public"]["Tables"]["product_metric_fields"]["Insert"]>;
        Relationships: [];
      };
      product_daily_metrics: {
        Row: {
          id: string;
          product_id: string;
          field_id: string;
          metric_date: string;
          value: number;
          updated_by: string | null;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["product_daily_metrics"]["Row"], "id" | "updated_at"> & {
          id?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["product_daily_metrics"]["Insert"]>;
        Relationships: [];
      };
      product_access: {
        Row: {
          product_id: string;
          user_id: string;
          granted_by: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["product_access"]["Row"], "created_at"> & {
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["product_access"]["Insert"]>;
        Relationships: [];
      };
      task_columns: {
        Row: {
          id: string;
          product_id: string;
          name: string;
          position: number;
          created_by: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["task_columns"]["Row"], "id" | "created_at" | "position"> & {
          id?: string;
          created_at?: string;
          position?: number;
        };
        Update: Partial<Database["public"]["Tables"]["task_columns"]["Insert"]>;
        Relationships: [];
      };
      tasks: {
        Row: {
          id: string;
          product_id: string;
          column_id: string;
          title: string;
          description: string | null;
          position: number;
          completed: boolean;
          due_at: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["tasks"]["Row"],
          "id" | "created_at" | "updated_at" | "position" | "completed" | "description" | "due_at"
        > & {
          id?: string;
          created_at?: string;
          updated_at?: string;
          position?: number;
          completed?: boolean;
          description?: string | null;
          due_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["tasks"]["Insert"]>;
        Relationships: [];
      };
      task_attachments: {
        Row: {
          id: string;
          task_id: string;
          product_id: string;
          file_url: string;
          file_name: string;
          file_type: string | null;
          variant_id: string | null;
          position: number;
          created_by: string | null;
          created_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["task_attachments"]["Row"],
          "id" | "created_at" | "variant_id" | "position"
        > & {
          id?: string;
          created_at?: string;
          variant_id?: string | null;
          position?: number;
        };
        Update: Partial<Database["public"]["Tables"]["task_attachments"]["Insert"]>;
        Relationships: [];
      };
      task_attachment_variants: {
        Row: {
          id: string;
          task_id: string;
          product_id: string;
          name: string;
          position: number;
          created_by: string | null;
          created_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["task_attachment_variants"]["Row"],
          "id" | "created_at" | "position"
        > & {
          id?: string;
          created_at?: string;
          position?: number;
        };
        Update: Partial<Database["public"]["Tables"]["task_attachment_variants"]["Insert"]>;
        Relationships: [];
      };
      tracking_leads: {
        Row: {
          id: string;
          product_id: string;
          utm_source: string | null;
          utm_medium: string | null;
          utm_campaign: string | null;
          utm_content: string | null;
          utm_term: string | null;
          fbclid: string | null;
          gclid: string | null;
          meta_campaign_id: string | null;
          google_campaign_id: string | null;
          fbp: string | null;
          fbc: string | null;
          landing_url: string | null;
          referrer: string | null;
          email: string | null;
          phone: string | null;
          first_seen_at: string;
          created_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["tracking_leads"]["Row"],
          | "utm_source"
          | "utm_medium"
          | "utm_campaign"
          | "utm_content"
          | "utm_term"
          | "fbclid"
          | "gclid"
          | "meta_campaign_id"
          | "google_campaign_id"
          | "fbp"
          | "fbc"
          | "landing_url"
          | "referrer"
          | "email"
          | "phone"
          | "first_seen_at"
          | "created_at"
        > & {
          utm_source?: string | null;
          utm_medium?: string | null;
          utm_campaign?: string | null;
          utm_content?: string | null;
          utm_term?: string | null;
          fbclid?: string | null;
          gclid?: string | null;
          meta_campaign_id?: string | null;
          google_campaign_id?: string | null;
          fbp?: string | null;
          fbc?: string | null;
          landing_url?: string | null;
          referrer?: string | null;
          email?: string | null;
          phone?: string | null;
          first_seen_at?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["tracking_leads"]["Insert"]>;
        Relationships: [];
      };
      tracking_events: {
        Row: {
          id: string;
          product_id: string;
          lead_id: string | null;
          event_type: "page_view" | "initiate_checkout" | "purchase" | "members_access" | "broker_signup" | "broker_deposit" | "contract_signed";
          source: string;
          email: string | null;
          amount_cents: number | null;
          currency: string;
          external_id: string | null;
          offer_name: string | null;
          payment_method: string | null;
          raw_payload: Record<string, unknown> | null;
          occurred_at: string;
          received_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["tracking_events"]["Row"],
          "id" | "lead_id" | "email" | "amount_cents" | "currency" | "external_id" | "offer_name" | "payment_method" | "raw_payload" | "occurred_at" | "received_at"
        > & {
          id?: string;
          lead_id?: string | null;
          email?: string | null;
          amount_cents?: number | null;
          currency?: string;
          external_id?: string | null;
          offer_name?: string | null;
          payment_method?: string | null;
          raw_payload?: Record<string, unknown> | null;
          occurred_at?: string;
          received_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["tracking_events"]["Insert"]>;
        Relationships: [];
      };
      tracking_webhook_endpoints: {
        Row: {
          id: string;
          product_id: string;
          kind: "checkout" | "members_area" | "broker" | "contract";
          platform: string | null;
          label: string | null;
          endpoint_slug: string;
          encrypted_secret: string;
          active: boolean;
          last_test_at: string | null;
          last_test_ok: boolean | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["tracking_webhook_endpoints"]["Row"],
          "id" | "platform" | "label" | "active" | "last_test_at" | "last_test_ok" | "created_by" | "created_at"
        > & {
          id?: string;
          platform?: string | null;
          label?: string | null;
          active?: boolean;
          last_test_at?: string | null;
          last_test_ok?: boolean | null;
          created_by?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["tracking_webhook_endpoints"]["Insert"]>;
        Relationships: [];
      };
      sendpulse_settings: {
        Row: {
          id: string;
          product_id: string;
          enabled: boolean;
          /** tipo + plano, ex: "boasvindas_starter", "contrato_elite", "contrato_geral". */
          key: string;
          url: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["sendpulse_settings"]["Row"],
          "id" | "enabled" | "url" | "created_at" | "updated_at"
        > & {
          id?: string;
          enabled?: boolean;
          url?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["sendpulse_settings"]["Insert"]>;
        Relationships: [];
      };
      sendpulse_boasvindas_sent: {
        Row: {
          id: string;
          product_id: string;
          email: string;
          plano: string;
          created_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["sendpulse_boasvindas_sent"]["Row"],
          "id" | "created_at"
        > & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["sendpulse_boasvindas_sent"]["Insert"]>;
        Relationships: [];
      };
      sendpulse_dispatch_log: {
        Row: {
          id: string;
          product_id: string;
          tipo: "boas_vindas" | "contrato";
          email: string;
          phone: string;
          plano: string;
          destino: string;
          status: "enviando" | "enviado" | "falhou";
          erro: string;
          response_body: string;
          payload: Record<string, unknown> | null;
          created_at: string;
          sent_at: string | null;
        };
        Insert: Omit<
          Database["public"]["Tables"]["sendpulse_dispatch_log"]["Row"],
          "id" | "phone" | "plano" | "destino" | "erro" | "response_body" | "payload" | "created_at" | "sent_at"
        > & {
          id?: string;
          phone?: string;
          plano?: string;
          destino?: string;
          erro?: string;
          response_body?: string;
          payload?: Record<string, unknown> | null;
          created_at?: string;
          sent_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["sendpulse_dispatch_log"]["Insert"]>;
        Relationships: [];
      };
      ad_platform_credentials: {
        Row: {
          id: string;
          product_id: string;
          platform: "meta" | "google";
          label: string | null;
          encrypted_credentials: string;
          ad_account_id: string | null;
          is_valid: boolean;
          last_checked_at: string | null;
          last_synced_at: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["ad_platform_credentials"]["Row"],
          | "id"
          | "label"
          | "ad_account_id"
          | "is_valid"
          | "last_checked_at"
          | "last_synced_at"
          | "created_by"
          | "created_at"
        > & {
          id?: string;
          label?: string | null;
          ad_account_id?: string | null;
          is_valid?: boolean;
          last_checked_at?: string | null;
          last_synced_at?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["ad_platform_credentials"]["Insert"]>;
        Relationships: [];
      };
      ad_campaign_spend: {
        Row: {
          id: string;
          product_id: string;
          platform: "meta" | "google";
          campaign_id: string;
          campaign_name: string | null;
          spend_cents: number;
          spend_date: string;
          synced_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["ad_campaign_spend"]["Row"],
          "id" | "campaign_name" | "spend_cents" | "synced_at"
        > & {
          id?: string;
          campaign_name?: string | null;
          spend_cents?: number;
          synced_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["ad_campaign_spend"]["Insert"]>;
        Relationships: [];
      };
      tracking_pixels: {
        Row: {
          id: string;
          product_id: string;
          platform: "meta" | "google";
          pixel_id: string;
          label: string | null;
          encrypted_capi_token: string | null;
          active: boolean;
          created_by: string | null;
          created_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["tracking_pixels"]["Row"],
          "id" | "label" | "encrypted_capi_token" | "active" | "created_by" | "created_at"
        > & {
          id?: string;
          label?: string | null;
          encrypted_capi_token?: string | null;
          active?: boolean;
          created_by?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["tracking_pixels"]["Insert"]>;
        Relationships: [];
      };
      tracking_webhook_log: {
        Row: {
          id: string;
          endpoint_id: string;
          raw_payload: Record<string, unknown>;
          accepted: boolean;
          error: string | null;
          received_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["tracking_webhook_log"]["Row"], "id" | "error" | "received_at"> & {
          id?: string;
          error?: string | null;
          received_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["tracking_webhook_log"]["Insert"]>;
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
      tracking_campaign_report: {
        Args: { p_product_id: string; p_from: string; p_to: string };
        Returns: {
          utm_source: string;
          utm_campaign: string;
          leads: number;
          initiate_checkouts: number;
          purchases: number;
          purchase_revenue_cents: number;
          members_access: number;
          broker_signups: number;
          deposits: number;
          deposits_total_cents: number;
          spend_cents: number;
        }[];
      };
      tracking_sales_by_offer: {
        Args: { p_product_id: string; p_from: string; p_to: string };
        Returns: { offer_name: string; purchases: number; revenue_cents: number }[];
      };
      tracking_sales_by_payment_method: {
        Args: { p_product_id: string; p_from: string; p_to: string };
        Returns: { payment_method: string; purchases: number; revenue_cents: number }[];
      };
      tracking_sales_by_time: {
        Args: { p_product_id: string; p_from: string; p_to: string };
        Returns: { weekday: number; hour: number; purchases: number }[];
      };
      tracking_sales_by_page_type: {
        Args: { p_product_id: string; p_from: string; p_to: string };
        Returns: { page_type: string; purchases: number; revenue_cents: number }[];
      };
      tracking_sales_by_channel: {
        Args: { p_product_id: string; p_from: string; p_to: string };
        Returns: { channel: string; purchases: number; revenue_cents: number }[];
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
