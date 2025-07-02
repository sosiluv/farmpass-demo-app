import { ReactNode } from "react";

export function CommonListWrapper({ children }: { children: ReactNode }) {
  return (
    <div className="space-y-2 sm:space-y-3 lg:space-y-4 xl:space-y-5 2xl:space-y-6">
      {children}
    </div>
  );
}
