import { PhoneFrame } from "./phone-frame";
import { WhatsappChat } from "./whatsapp-chat";
import { InstagramChat } from "./instagram-chat";
import type { ConversationMessage, Platform } from "@/lib/supabase/types";

interface PhonePreviewProps {
  platform: Platform;
  showFrame: boolean;
  contactName: string;
  contactAvatarUrl: string | null;
  contactStatus: string;
  statusBarTime: string;
  messages: ConversationMessage[];
}

export function PhonePreview(props: PhonePreviewProps) {
  const { platform, showFrame, ...chatProps } = props;

  return (
    <PhoneFrame showFrame={showFrame}>
      {platform === "whatsapp" ? <WhatsappChat {...chatProps} /> : <InstagramChat {...chatProps} />}
    </PhoneFrame>
  );
}
