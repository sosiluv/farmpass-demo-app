import { FarmsHookComparison } from "@/components/test/FarmsHookComparison";

export default function FarmsReactQueryTestPage() {
  // 테스트용 사용자 ID와 농장 ID들
  const testUserId = undefined; // 현재 인증된 사용자 사용
  const testFarmIds = [
    "3d5f33f1-cff9-4a18-970b-6edaca7c61e6",
    // 추가 테스트 농장 ID들이 있다면 여기에 추가
  ];

  return (
    <div>
      <FarmsHookComparison userId={testUserId} testFarmIds={testFarmIds} />
    </div>
  );
}
