import { VisitorsHookComparison } from "@/components/test/VisitorsHookComparison";

export default function ReactQueryTestPage() {
  // 테스트할 농장 ID (실제 농장 ID로 변경)
  const testFarmId = "3d5f33f1-cff9-4a18-970b-6edaca7c61e6"; // 실제 테스트할 농장 ID로 변경

  return (
    <div>
      <VisitorsHookComparison farmId={testFarmId} />
    </div>
  );
}
