import { ReactNode } from "react";

export function CommonPageWrapper({ children }: { children: ReactNode }) {
  return <div className="space-y-6 sm:space-y-8 lg:space-y-10">{children}</div>;
}
