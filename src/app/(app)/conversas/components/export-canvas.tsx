import { type ReactNode } from "react";

export function ExportCanvas({ children }: { children: ReactNode }) {
  return <div id="export-content">{children}</div>;
}
