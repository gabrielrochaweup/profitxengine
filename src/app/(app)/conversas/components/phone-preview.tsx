import { PhoneFrame, CrmFrame } from "./phone-frame";
import { WhatsappChat } from "./whatsapp-chat";
import { InstagramChat } from "./instagram-chat";
import { CrmChat } from "./crm-chat";
import type { ConversationMessage, Platform } from "@/lib/supabase/types";

interface PhonePreviewProps {
  platform: Platform;
  showFrame: boolean;
  contactName: string;
  contactAvatarUrl: string | null;
  contactStatus: string;
  statusBarTime: string;
  messages: ConversationMessage[];
  crmInstanceName?: string;
  crmAssigneeName?: string;
  crmAssigneeAvatarUrl?: string | null;
  crmStatus?: string;
}

export function PhonePreview(props: PhonePreviewProps) {
  const { platform, showFrame, crmInstanceName, crmAssigneeName, crmAssigneeAvatarUrl, crmStatus, ...chatProps } =
    props;

  if (platform === "crm") {
    return (
      <CrmFrame>
        <CrmChat
          instanceName={crmInstanceName ?? ""}
          contactName={chatProps.contactName}
          contactAvatarUrl={chatProps.contactAvatarUrl}
          assigneeName={crmAssigneeName ?? ""}
          assigneeAvatarUrl={crmAssigneeAvatarUrl ?? null}
          status={crmStatus ?? "aberto"}
          messages={chatProps.messages}
        />
      </CrmFrame>
    );
  }

  return (
    <PhoneFrame showFrame={showFrame}>
      {platform === "whatsapp" ? <WhatsappChat {...chatProps} /> : <InstagramChat {...chatProps} />}
    </PhoneFrame>
  );
}
