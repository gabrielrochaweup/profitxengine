import { type ReactNode } from "react";

interface PhoneFrameProps {
  showFrame: boolean;
  children: ReactNode;
}

export const PHONE_WIDTH = 375;
export const PHONE_HEIGHT = 812;

export const CRM_WIDTH = 440;
export const CRM_HEIGHT = 780;

export function PhoneFrame({ showFrame, children }: PhoneFrameProps) {
  if (!showFrame) {
    return (
      <div className="overflow-hidden bg-black" style={{ width: PHONE_WIDTH, height: PHONE_HEIGHT }}>
        {children}
      </div>
    );
  }

  return (
    <div className="w-fit rounded-[52px] border-[10px] border-neutral-900 bg-neutral-900 p-0 shadow-2xl">
      <div
        className="relative overflow-hidden rounded-[42px] bg-black"
        style={{ width: PHONE_WIDTH, height: PHONE_HEIGHT }}
      >
        <div className="absolute left-1/2 top-0 z-10 h-6 w-32 -translate-x-1/2 rounded-b-2xl bg-neutral-900" />
        {children}
        <div className="absolute bottom-1.5 left-1/2 z-10 h-1 w-32 -translate-x-1/2 rounded-full bg-white/70" />
      </div>
    </div>
  );
}

export function CrmFrame({ children }: { children: ReactNode }) {
  return (
    <div
      className="overflow-hidden rounded-2xl border border-white/10 bg-[#111318] shadow-2xl"
      style={{ width: CRM_WIDTH, height: CRM_HEIGHT }}
    >
      {children}
    </div>
  );
}
