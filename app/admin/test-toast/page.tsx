"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useCommonToast } from "@/lib/utils/notification/toast-messages";
import { useToast } from "@/hooks/use-toast";

export default function TestToastPage() {
  const {
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showCustomSuccess,
    showCustomError,
  } = useCommonToast();
  const { toast } = useToast();

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">🍞 토스트 UI 테스트</h1>
        <p className="text-muted-foreground">
          새로운 세련된 토스트 디자인을 테스트해보세요
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* 기본 토스트 테스트 */}
        <Card>
          <CardHeader>
            <CardTitle>기본 토스트</CardTitle>
            <CardDescription>
              다양한 타입의 토스트를 테스트합니다
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              onClick={() =>
                showSuccess("성공!", "작업이 성공적으로 완료되었습니다.")
              }
              className="w-full bg-emerald-600 hover:bg-emerald-700"
            >
              성공 토스트
            </Button>
            <Button
              onClick={() =>
                showError("오류 발생", "작업 중 오류가 발생했습니다.")
              }
              variant="destructive"
              className="w-full"
            >
              에러 토스트
            </Button>
            <Button
              onClick={() => showWarning("경고", "주의가 필요한 상황입니다.")}
              className="w-full bg-amber-600 hover:bg-amber-700"
            >
              경고 토스트
            </Button>
            <Button
              onClick={() => showInfo("정보", "유용한 정보를 확인하세요.")}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              정보 토스트
            </Button>
          </CardContent>
        </Card>

        {/* 커스텀 토스트 테스트 */}
        <Card>
          <CardHeader>
            <CardTitle>커스텀 토스트</CardTitle>
            <CardDescription>
              긴 메시지와 다양한 내용을 테스트합니다
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              onClick={() =>
                showCustomSuccess(
                  "농장 등록 완료",
                  "새로운 농장이 성공적으로 등록되었습니다. 이제 방문자 관리와 모니터링을 시작할 수 있습니다."
                )
              }
              className="w-full bg-emerald-600 hover:bg-emerald-700"
            >
              긴 성공 메시지
            </Button>
            <Button
              onClick={() =>
                showCustomError(
                  "네트워크 오류",
                  "서버와의 연결이 실패했습니다. 인터넷 연결을 확인하고 다시 시도해주세요."
                )
              }
              variant="destructive"
              className="w-full"
            >
              긴 에러 메시지
            </Button>
          </CardContent>
        </Card>

        {/* 직접 토스트 테스트 */}
        <Card>
          <CardHeader>
            <CardTitle>직접 토스트</CardTitle>
            <CardDescription>원본 toast 함수를 직접 사용합니다</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              onClick={() =>
                toast({
                  title: "직접 토스트",
                  description: "원본 toast 함수로 생성된 토스트입니다.",
                  variant: "default",
                })
              }
              className="w-full"
            >
              기본 토스트
            </Button>
            <Button
              onClick={() =>
                toast({
                  title: "액션 포함",
                  description: "액션 버튼이 포함된 토스트입니다.",
                  variant: "info",
                  action: (
                    <Button size="sm" variant="outline" className="h-7 px-2">
                      확인
                    </Button>
                  ),
                })
              }
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              액션 포함 토스트
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* 디자인 가이드 */}
      <Card>
        <CardHeader>
          <CardTitle>🎨 디자인 특징</CardTitle>
          <CardDescription>새로운 토스트 UI의 주요 개선사항</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-semibold">시각적 개선</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• 둥근 모서리 (rounded-2xl)</li>
                <li>• 반투명 배경과 블러 효과</li>
                <li>• 부드러운 그림자와 애니메이션</li>
                <li>• 우측 상단에서 슬라이드 인</li>
                <li>• 호버 시 스케일 효과</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">사용성 개선</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• 아이콘으로 메시지 타입 구분</li>
                <li>• 4초 자동 사라짐</li>
                <li>• 스와이프로 닫기 가능</li>
                <li>• 접근성 향상</li>
                <li>• 모바일 최적화</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
