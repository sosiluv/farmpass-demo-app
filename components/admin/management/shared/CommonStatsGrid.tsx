import { ReactNode } from "react";

export function CommonStatsGrid({ children }: { children: ReactNode }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {children}
    </div>
  );
}
