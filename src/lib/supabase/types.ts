export type UserRole = "admin" | "editor" | "viewer";

/** Papel dentro de UMA sala da comunidade — não confundir com o papel no app. */
export type CommunityPapel = "admin" | "moderador" | "membro";
export type UserStatus = "pending" | "approved" | "rejected";
export type AiProvider = "openai" | "anthropic" | "google";
export type Platform = "whatsapp" | "instagram" | "crm";
export type EngagementStatus = "rascunho" | "aprovada" | "enviada";
export type EngagementResult = "funcionou" | "nao_funcionou" | null;
export type EmailStatus = "rascunho" | "pronto" | "enviado";
export type AiModule = "conversa" | "mensagem" | "imagem" | "email" | "blog" | "egi";
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
          /** % da banca arriscada por operação no Copy — base da estimativa do R$ quando o rendimento não vem informado. */
          entrada_copy_pct: number;
          /** Sobrescreve, em toda dinâmica, o número embutido no link de WhatsApp da Alavancagem. null = mantém o de cada dinâmica. */
          numero_alavancagem_override: string | null;
          updated_by: string | null;
          updated_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["trading_config"]["Row"],
          "updated_at" | "numero_alavancagem_override" | "entrada_copy_pct"
        > & {
          updated_at?: string;
          entrada_copy_pct?: number;
          numero_alavancagem_override?: string | null;
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
          /** 'clean' (padrão a partir da migration 0115) ou 'apelativo' (visual antigo, mantido como opção). */
          style: "clean" | "apelativo";
          created_by: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["image_prompt_templates"]["Row"], "id" | "created_at" | "dynamic_id" | "msg_key" | "style"> & {
          id?: string;
          created_at?: string;
          dynamic_id?: string | null;
          msg_key?: string | null;
          style?: "clean" | "apelativo";
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
          /** Caminho dentro do bucket — é o que se assina. Ver migration 0111. */
          file_path: string | null;
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
          /** Navegador da primeira visita — a API de Conversões exige pra evento "website" (0124). */
          client_user_agent: string | null;
          /** IP da primeira visita — melhora o casamento do evento na API de Conversões (0124). */
          client_ip: string | null;
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
          | "client_user_agent"
          | "client_ip"
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
          client_user_agent?: string | null;
          client_ip?: string | null;
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
          event_type: "page_view" | "initiate_checkout" | "purchase" | "members_access" | "broker_signup" | "broker_deposit" | "contract_signed" | "tool_signup" | "tool_access" | "members_reengagement_sent";
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
          /** 'front' | 'order_bump' | 'upsell' | 'downsell' (ou texto cru de um tipo não mapeado). Nulo = principal. Migration 0134. */
          item_tipo: string | null;
          /** ID do produto do item na plataforma (ex: 6104) — estável, ao contrário do nome. */
          item_id: string | null;
          /** Nome do item em si, ex: "[TRIAD] VITALICIO". */
          item_nome: string | null;
          /** Identificador do pagamento — o mesmo em todos os itens pagos juntos. */
          pedido_id: string | null;
          /** Total do pagamento (todos os itens somados), em centavos. */
          pedido_total_cents: number | null;
        };
        Insert: Omit<
          Database["public"]["Tables"]["tracking_events"]["Row"],
          "id" | "lead_id" | "email" | "amount_cents" | "currency" | "external_id" | "offer_name" | "payment_method" | "raw_payload" | "occurred_at" | "received_at" | "item_tipo" | "item_id" | "item_nome" | "pedido_id" | "pedido_total_cents"
        > & {
          item_tipo?: string | null;
          item_id?: string | null;
          item_nome?: string | null;
          pedido_id?: string | null;
          pedido_total_cents?: number | null;
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
          kind: "checkout" | "members_area" | "broker" | "contract" | "tool" | "daily_results";
          platform: string | null;
          label: string | null;
          endpoint_slug: string;
          encrypted_secret: string;
          active: boolean;
          /** ativo = grava e manda pra Meta; teste = só confere; pausado = recusa. Ver migration 0130. */
          modo: "ativo" | "teste" | "pausado";
          last_test_at: string | null;
          last_test_ok: boolean | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["tracking_webhook_endpoints"]["Row"],
          "id" | "platform" | "label" | "active" | "modo" | "last_test_at" | "last_test_ok" | "created_by" | "created_at"
        > & {
          id?: string;
          platform?: string | null;
          label?: string | null;
          active?: boolean;
          modo?: "ativo" | "teste" | "pausado";
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
      sendpulse_funil_enviado: {
        Row: {
          id: string;
          product_id: string;
          tipo: "boas_vindas" | "contrato";
          email: string;
          plano: string;
          created_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["sendpulse_funil_enviado"]["Row"],
          "id" | "created_at"
        > & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["sendpulse_funil_enviado"]["Insert"]>;
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
          teste: boolean;
          created_at: string;
          sent_at: string | null;
        };
        Insert: Omit<
          Database["public"]["Tables"]["sendpulse_dispatch_log"]["Row"],
          "id" | "phone" | "plano" | "destino" | "erro" | "response_body" | "payload" | "teste" | "created_at" | "sent_at"
        > & {
          id?: string;
          phone?: string;
          plano?: string;
          destino?: string;
          erro?: string;
          response_body?: string;
          payload?: Record<string, unknown> | null;
          teste?: boolean;
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
          status: "ativa" | "pronta" | "restrita" | "bloqueada";
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
          | "status"
          | "last_checked_at"
          | "last_synced_at"
          | "created_by"
          | "created_at"
        > & {
          id?: string;
          label?: string | null;
          ad_account_id?: string | null;
          is_valid?: boolean;
          status?: "ativa" | "pronta" | "restrita" | "bloqueada";
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
          /** Em reais, sempre (o sync converte da moeda da conta). */
          spend_cents: number;
          /** O gasto como veio da plataforma, na moeda da conta. Nulo antes da migration 0132. */
          gasto_original_cents: number | null;
          /** Moeda da conta de anúncio (USD, BRL...). */
          moeda: string | null;
          /** Cotação usada pra chegar em spend_cents (1 quando a conta já é em real). */
          cambio: number | null;
          spend_date: string;
          synced_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["ad_campaign_spend"]["Row"],
          "id" | "campaign_name" | "spend_cents" | "synced_at" | "gasto_original_cents" | "moeda" | "cambio"
        > & {
          id?: string;
          campaign_name?: string | null;
          spend_cents?: number;
          gasto_original_cents?: number | null;
          moeda?: string | null;
          cambio?: number | null;
          synced_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["ad_campaign_spend"]["Insert"]>;
        Relationships: [];
      };
      blog_dominios: {
        Row: {
          id: string;
          product_id: string;
          dominio: string;
          caminho: string;
          modo: "subdiretorio" | "subdominio";
          nome: string | null;
          idioma: string;
          publico_alvo: string | null;
          tom: string | null;
          token_verificacao: string;
          verificado: boolean;
          verificado_em: string | null;
          ativo: boolean;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["blog_dominios"]["Row"],
          | "id"
          | "caminho"
          | "modo"
          | "nome"
          | "idioma"
          | "publico_alvo"
          | "tom"
          | "token_verificacao"
          | "verificado"
          | "verificado_em"
          | "ativo"
          | "created_by"
          | "created_at"
          | "updated_at"
        > & {
          caminho?: string;
          modo?: "subdiretorio" | "subdominio";
          nome?: string | null;
          idioma?: string;
          publico_alvo?: string | null;
          tom?: string | null;
          created_by?: string | null;
          id?: string;
          token_verificacao?: string;
          verificado?: boolean;
          verificado_em?: string | null;
          ativo?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["blog_dominios"]["Insert"]>;
        Relationships: [];
      };
      blog_posts: {
        Row: {
          id: string;
          product_id: string;
          dominio_id: string | null;
          slug: string;
          titulo: string;
          meta_descricao: string | null;
          palavra_chave: string | null;
          conteudo_md: string;
          imagem_url: string | null;
          imagem_alt: string | null;
          imagem_prompt: string | null;
          status: "rascunho" | "publicado";
          publicado_em: string | null;
          tema: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["blog_posts"]["Row"],
          | "id"
          | "dominio_id"
          | "meta_descricao"
          | "palavra_chave"
          | "conteudo_md"
          | "imagem_url"
          | "imagem_alt"
          | "imagem_prompt"
          | "status"
          | "publicado_em"
          | "tema"
          | "created_by"
          | "created_at"
          | "updated_at"
        > & {
          id?: string;
          dominio_id?: string | null;
          meta_descricao?: string | null;
          palavra_chave?: string | null;
          conteudo_md?: string;
          imagem_url?: string | null;
          imagem_alt?: string | null;
          imagem_prompt?: string | null;
          status?: "rascunho" | "publicado";
          publicado_em?: string | null;
          tema?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["blog_posts"]["Insert"]>;
        Relationships: [];
      };
      acessos: {
        Row: {
          id: string;
          product_id: string;
          nome: string;
          categoria: "rede" | "ferramenta" | "financeiro" | "outro";
          url: string | null;
          usuario: string | null;
          encrypted_senha: string | null;
          login_google: boolean;
          tem_2fa: boolean;
          onde_2fa: string | null;
          responsavel: string | null;
          assinatura: boolean;
          valor_cents: number;
          moeda: "BRL" | "USD";
          ciclo: "mensal" | "anual";
          observacoes: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["acessos"]["Row"],
          "id" | "created_at" | "updated_at" | "login_google"
        > & {
          id?: string;
          created_at?: string;
          updated_at?: string;
          login_google?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["acessos"]["Insert"]>;
        Relationships: [];
      };
      resultados_do_dia: {
        Row: {
          id: string;
          product_id: string;
          /** YYYY-MM-DD */
          data: string;
          preenchido: boolean;
          texto: string | null;
          resumo: Record<string, unknown> | null;
          raw_payload: unknown;
          origem: "webhook" | "botao";
          aplicado: boolean;
          motivo: string | null;
          recebido_em: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["resultados_do_dia"]["Row"],
          "id" | "recebido_em" | "texto" | "resumo" | "aplicado" | "motivo"
        > & {
          id?: string;
          recebido_em?: string;
          texto?: string | null;
          resumo?: Record<string, unknown> | null;
          aplicado?: boolean;
          motivo?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["resultados_do_dia"]["Insert"]>;
        Relationships: [];
      };
      egi_config: {
        Row: {
          product_id: string;
          prompt: string;
          updated_by: string | null;
          updated_at: string;
        };
        Insert: { product_id: string; prompt?: string; updated_by?: string | null; updated_at?: string };
        Update: Partial<Database["public"]["Tables"]["egi_config"]["Insert"]>;
        Relationships: [];
      };
      egi_arquivos: {
        Row: {
          id: string;
          product_id: string;
          nome: string;
          conteudo: string;
          ativo: boolean;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          nome: string;
          conteudo: string;
          ativo?: boolean;
          created_by?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["egi_arquivos"]["Insert"]>;
        Relationships: [];
      };
      egi_faq: {
        Row: {
          id: string;
          product_id: string;
          pergunta: string;
          resposta: string;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          pergunta: string;
          resposta: string;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["egi_faq"]["Insert"]>;
        Relationships: [];
      };
      egi_conversas: {
        Row: {
          id: string;
          product_id: string;
          user_id: string;
          titulo: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          user_id: string;
          titulo?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["egi_conversas"]["Insert"]>;
        Relationships: [];
      };
      egi_mensagens: {
        Row: {
          id: string;
          conversa_id: string;
          papel: "user" | "assistant";
          conteudo: string;
          faq_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          conversa_id: string;
          papel: "user" | "assistant";
          conteudo: string;
          faq_id?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["egi_mensagens"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "egi_mensagens_conversa_id_fkey";
            columns: ["conversa_id"];
            isOneToOne: false;
            referencedRelation: "egi_conversas";
            referencedColumns: ["id"];
          },
        ];
      };
      numeros_de_atendimento: {
        Row: {
          id: string;
          product_id: string;
          numero: string;
          nome: string;
          cor: string;
          funcao: "suporte" | "comercial";
          usuario_id: string | null;
          /** Conta do SendPulse em que este número está cadastrado. */
          sendpulse_email: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["numeros_de_atendimento"]["Row"],
          "id" | "created_at" | "cor" | "usuario_id" | "sendpulse_email"
        > & {
          id?: string;
          created_at?: string;
          cor?: string;
          usuario_id?: string | null;
          sendpulse_email?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["numeros_de_atendimento"]["Insert"]>;
        Relationships: [];
      };
      swipes: {
        Row: {
          id: string;
          product_id: string;
          nome: string;
          nicho: string | null;
          subnicho: string | null;
          pais_idioma: string | null;
          plataforma: string | null;
          preco_front: number | null;
          order_bumps: { nome: string; preco: number | null }[];
          upsells: { nome: string; preco: number | null }[];
          link_pagina_vendas: string | null;
          link_checkout: string | null;
          link_ad_library: string | null;
          pagina_fb: string | null;
          anuncios_ativos: number | null;
          /** Cada contagem de anúncios ativos, com o dia (AAAA-MM-DD) em que foi vista. */
          historico_anuncios: { data: string; valor: number }[];
          rodando_desde: string | null;
          formato_pagina: string | null;
          promessa: string | null;
          mecanismo: string | null;
          ganchos: string[];
          tipos_criativo: string[];
          score: number | null;
          por_que_achei_boa: string | null;
          prints: string[];
          status: "em_analise" | "modelando" | "descartado";
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Omit<Database["public"]["Tables"]["swipes"]["Row"], "product_id" | "nome">> & {
          product_id: string;
          nome: string;
        };
        Update: Partial<Database["public"]["Tables"]["swipes"]["Insert"]>;
        Relationships: [];
      };
      ad_business_managers: {
        Row: {
          id: string;
          product_id: string;
          platform: "meta" | "google";
          nome: string;
          external_id: string | null;
          status: "ativa" | "pronta" | "restrita" | "bloqueada";
          contas: string;
          paginas: string;
          observacoes: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["ad_business_managers"]["Row"],
          "id" | "external_id" | "status" | "contas" | "paginas" | "observacoes" | "created_by" | "created_at" | "updated_at"
        > & {
          id?: string;
          external_id?: string | null;
          status?: "ativa" | "pronta" | "restrita" | "bloqueada";
          contas?: string;
          paginas?: string;
          observacoes?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["ad_business_managers"]["Insert"]>;
        Relationships: [];
      };
      tracking_checkout_links: {
        Row: {
          id: string;
          product_id: string;
          plano: string;
          checkout: string;
          url: string;
          position: number;
          created_by: string | null;
          created_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["tracking_checkout_links"]["Row"],
          "id" | "position" | "created_by" | "created_at"
        > & {
          id?: string;
          position?: number;
          created_by?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["tracking_checkout_links"]["Insert"]>;
        Relationships: [];
      };
      tracking_utm_presets: {
        Row: {
          id: string;
          product_id: string;
          nome: string;
          utm_source: string;
          utm_medium: string;
          utm_campaign: string;
          utm_content: string;
          position: number;
          created_by: string | null;
          created_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["tracking_utm_presets"]["Row"],
          "id" | "utm_source" | "utm_medium" | "utm_campaign" | "utm_content" | "position" | "created_by" | "created_at"
        > & {
          id?: string;
          utm_source?: string;
          utm_medium?: string;
          utm_campaign?: string;
          utm_content?: string;
          position?: number;
          created_by?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["tracking_utm_presets"]["Insert"]>;
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
      tracking_capi_log: {
        Row: {
          id: string;
          product_id: string;
          event_name: string;
          pixel_id: string | null;
          lead_id: string | null;
          external_id: string | null;
          amount_cents: number | null;
          currency: string | null;
          ok: boolean;
          events_received: number | null;
          fbtrace_id: string | null;
          erro: string | null;
          teste: boolean;
          enviado_em: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          event_name: string;
          pixel_id?: string | null;
          lead_id?: string | null;
          external_id?: string | null;
          amount_cents?: number | null;
          currency?: string | null;
          ok: boolean;
          events_received?: number | null;
          fbtrace_id?: string | null;
          erro?: string | null;
          teste?: boolean;
          enviado_em?: string;
        };
        Update: Partial<Database["public"]["Tables"]["tracking_capi_log"]["Insert"]>;
        Relationships: [];
      };
      ad_entity_spend: {
        Row: {
          id: string;
          product_id: string;
          platform: "meta" | "google";
          level: "adset" | "ad";
          entity_id: string;
          entity_name: string | null;
          campaign_id: string | null;
          adset_id: string | null;
          /** Em reais, sempre (o sync converte da moeda da conta). */
          spend_cents: number;
          /** O gasto como veio da plataforma, na moeda da conta. Nulo antes da migration 0132. */
          gasto_original_cents: number | null;
          /** Moeda da conta de anúncio (USD, BRL...). */
          moeda: string | null;
          /** Cotação usada pra chegar em spend_cents (1 quando a conta já é em real). */
          cambio: number | null;
          spend_date: string;
          synced_at: string;
        };
        Insert: {
          gasto_original_cents?: number | null;
          moeda?: string | null;
          cambio?: number | null;
          id?: string;
          product_id: string;
          platform: "meta" | "google";
          level: "adset" | "ad";
          entity_id: string;
          entity_name?: string | null;
          campaign_id?: string | null;
          adset_id?: string | null;
          spend_cents?: number;
          spend_date: string;
          synced_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["ad_entity_spend"]["Insert"]>;
        Relationships: [];
      };
      ad_entity_names: {
        Row: {
          product_id: string;
          platform: "meta" | "google";
          entity_id: string;
          level: "campaign" | "adset" | "ad";
          name: string;
          updated_at: string;
        };
        Insert: {
          product_id: string;
          platform: "meta" | "google";
          entity_id: string;
          level: "campaign" | "adset" | "ad";
          name: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["ad_entity_names"]["Insert"]>;
        Relationships: [];
      };
      tracking_script_config: {
        Row: {
          product_id: string;
          /** Ver src/lib/tracking/eventos-meta.ts (lerEventosMeta). */
          eventos_meta: Record<string, unknown>;
          paginas_checkout: string[];
          updated_by: string | null;
          updated_at: string;
        };
        Insert: {
          product_id: string;
          eventos_meta?: Record<string, unknown>;
          paginas_checkout?: string[];
          updated_by?: string | null;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["tracking_script_config"]["Insert"]>;
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
      community_rooms: {
        Row: {
          id: string;
          nome: string;
          descricao: string | null;
          icone: string | null;
          privada: boolean;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["community_rooms"]["Row"], "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["community_rooms"]["Insert"]>;
        Relationships: [];
      };
      community_room_members: {
        Row: {
          room_id: string;
          user_id: string;
          papel: CommunityPapel;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["community_room_members"]["Row"], "created_at" | "papel"> & {
          papel?: CommunityPapel;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["community_room_members"]["Insert"]>;
        Relationships: [];
      };
      community_messages: {
        Row: {
          id: string;
          room_id: string;
          autor_id: string | null;
          conteudo: string;
          responde_a: string | null;
          editada_em: string | null;
          excluida_em: string | null;
          created_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["community_messages"]["Row"],
          "id" | "created_at" | "editada_em" | "excluida_em" | "responde_a"
        > & {
          id?: string;
          responde_a?: string | null;
          editada_em?: string | null;
          excluida_em?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["community_messages"]["Insert"]>;
        Relationships: [];
      };
      community_reactions: {
        Row: {
          message_id: string;
          user_id: string;
          emoji: string;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["community_reactions"]["Row"], "created_at"> & {
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["community_reactions"]["Insert"]>;
        Relationships: [];
      };
      community_read_states: {
        Row: {
          room_id: string;
          user_id: string;
          last_read_at: string;
        };
        Insert: Database["public"]["Tables"]["community_read_states"]["Row"];
        Update: Partial<Database["public"]["Tables"]["community_read_states"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      community_nao_lidas: {
        Args: Record<string, never>;
        Returns: { room_id: string; nao_lidas: number }[];
      };
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
          contracts_signed: number;
          members_access: number;
          tool_signups: number;
          broker_signups: number;
          deposits: number;
          deposits_total_cents: number;
          spend_cents: number;
          /** Gasto em dólar (a moeda das contas). Só existe depois da migration 0133. */
          spend_usd_cents?: number;
        }[];
      };
      tracking_sales_by_offer: {
        Args: { p_product_id: string; p_from: string; p_to: string };
        Returns: { offer_name: string; purchases: number; revenue_cents: number }[];
      };
      tracking_itens_vendidos: {
        Args: { p_product_id: string; p_from: string; p_to: string };
        Returns: { item_tipo: string; item_nome: string; vendas: number; receita_cents: number }[];
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
      tracking_ferramenta_por_plano: {
        Args: { p_product_id: string; p_source: string; p_from: string; p_to: string };
        Returns: { plano: string; cadastrados: number; acessaram: number }[];
      };
      // Leitura própria do funil: quantas PESSOAS distintas chegaram em cada
      // etapa, com a contagem de eventos ao lado. Ver 0108.
      tracking_funil_pessoas: {
        Args: { p_product_id: string; p_from: string; p_to: string };
        Returns: { utm_source: string; etapa: string; pessoas: number; eventos: number }[];
      };
      tracking_atividade_por_horario: {
        Args: { p_product_id: string; p_from: string; p_to: string };
        Returns: { utm_source: string; etapa: string; weekday: number; hour: number; total: number }[];
      };
      tracking_registrar_visita: {
        Args: {
          p_product_id: string;
          p_lead_id: string;
          p_pagina: string;
          p_utm_source: string | null;
          p_utm_medium: string | null;
          p_utm_campaign: string | null;
          p_utm_content: string | null;
          p_referrer: string | null;
        };
        Returns: undefined;
      };
      tracking_origem_detalhada: {
        Args: { p_product_id: string; p_from: string; p_to: string };
        Returns: {
          utm_source: string;
          utm_medium: string;
          utm_campaign: string;
          utm_term: string;
          utm_content: string;
          leads: number;
          checkouts: number;
          compras: number;
          receita_cents: number;
          cadastros_corretora: number;
          depositos: number;
          depositado_cents: number;
        }[];
      };
      tracking_paginas_report: {
        Args: { p_product_id: string; p_from: string; p_to: string };
        Returns: {
          pagina: string;
          utm_source: string;
          utm_campaign: string;
          pessoas: number;
          visitas: number;
          leads_novos: number;
          checkouts: number;
          compras: number;
          depositos: number;
        }[];
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
