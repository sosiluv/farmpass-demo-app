import { ReactNode } from "react";

// 임시 래퍼: 기존 개별 StatCard 방식을 위한 호환성 래퍼
export function LegacyStatsGrid({ children }: { children: ReactNode }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {children}
    </div>
  );
}
