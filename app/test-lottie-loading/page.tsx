"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  LottieLoading,
  LottieLoadingCompact,
  LottieLoadingFullScreen,
} from "@/components/ui/lottie-loading";
import { PageLoading } from "@/components/ui/loading";

export default function TestLottieLoadingPage() {
  const [showFullScreen, setShowFullScreen] = useState(false);
  const [showPageLoading, setShowPageLoading] = useState(false);

  if (showFullScreen) {
    return (
      <div className="fixed inset-0 z-50">
        <LottieLoadingFullScreen
          text="전체 화면 로딩 테스트"
          subText="ESC를 눌러 종료하세요"
        />
        <Button
          variant="outline"
          onClick={() => setShowFullScreen(false)}
          className="fixed top-4 right-4 z-50"
        >
          닫기
        </Button>
      </div>
    );
  }

  if (showPageLoading) {
    return (
      <div className="min-h-screen">
        <PageLoading
          text="페이지 로딩 테스트 (Lottie)"
          subText="3초 후 자동으로 돌아갑니다"
          variant="lottie"
          fullScreen={true}
        />
        <Button
          variant="outline"
          onClick={() => setShowPageLoading(false)}
          className="fixed top-4 right-4 z-50"
        >
          돌아가기
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-4">
          🎬 Lottie 애니메이션 테스트 센터
        </h1>
        <p className="text-muted-foreground">
          모든 Lottie 애니메이션 파일을 테스트할 수 있는 데모 페이지
        </p>
      </div>

      {/* 모든 Lottie 파일 테스트 */}
      <Card>
        <CardHeader>
          <CardTitle>🎯 모든 Lottie 애니메이션 파일</CardTitle>
          <CardDescription>
            프로젝트에서 사용하는 모든 Lottie 애니메이션을 한 곳에서 확인
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* 404.json - 페이지 찾을 수 없음 */}
            <div className="text-center p-4 border rounded-lg">
              <h4 className="font-medium mb-2">🚫 404.json</h4>
              <p className="text-xs text-muted-foreground mb-3">페이지 없음</p>
              <LottieLoadingCompact
                animationPath="/lottie/404.json"
                size="md"
              />
            </div>

            {/* admin_error.json - 관리자 에러 */}
            <div className="text-center p-4 border rounded-lg">
              <h4 className="font-medium mb-2">🔧 admin_error.json</h4>
              <p className="text-xs text-muted-foreground mb-3">관리자 에러</p>
              <LottieLoadingCompact
                animationPath="/lottie/admin_error.json"
                size="md"
              />
            </div>

            {/* no_connection.json - 연결 없음 */}
            <div className="text-center p-4 border rounded-lg">
              <h4 className="font-medium mb-2">📡 no_connection.json</h4>
              <p className="text-xs text-muted-foreground mb-3">연결 없음</p>
              <LottieLoadingCompact
                animationPath="/lottie/no_connection.json"
                size="md"
              />
            </div>

            {/* no_result.json - 결과 없음 */}
            <div className="text-center p-4 border rounded-lg">
              <h4 className="font-medium mb-2">🔍 no_result.json</h4>
              <p className="text-xs text-muted-foreground mb-3">결과 없음</p>
              <LottieLoadingCompact
                animationPath="/lottie/no_result.json"
                size="md"
              />
            </div>

            {/* timeout.json - 타임아웃 */}
            <div className="text-center p-4 border rounded-lg">
              <h4 className="font-medium mb-2">⏰ timeout.json</h4>
              <p className="text-xs text-muted-foreground mb-3">시간 초과</p>
              <LottieLoadingCompact
                animationPath="/lottie/timeout.json"
                size="md"
              />
            </div>
          </div>
          {/* consent.json - 약관 동의 */}
          <div className="text-center p-4 border rounded-lg">
            <h4 className="font-medium mb-2">⚠️ consent.json</h4>
            <p className="text-xs text-muted-foreground mb-3">약관 동의</p>
            <LottieLoadingCompact
              animationPath="/lottie/consent.json"
              size="md"
            />
          </div>

          <div className="text-center p-4 border rounded-lg">
            <h4 className="font-medium mb-2">⚠️ destructive.json</h4>
            <p className="text-xs text-muted-foreground mb-3">파괴</p>
            <LottieLoadingCompact
              animationPath="/lottie/destructive.json"
              size="md"
            />
          </div>

          <div className="text-center p-4 border rounded-lg">
            <h4 className="font-medium mb-2">⚠️ error.json</h4>
            <p className="text-xs text-muted-foreground mb-3">에러</p>
            <LottieLoadingCompact
              animationPath="/lottie/error.json"
              size="md"
            />
          </div>

          <div className="text-center p-4 border rounded-lg">
            <h4 className="font-medium mb-2">⚠️ info.json</h4>
            <p className="text-xs text-muted-foreground mb-3">정보</p>
            <LottieLoadingCompact animationPath="/lottie/info.json" size="md" />
          </div>

          <div className="text-center p-4 border rounded-lg">
            <h4 className="font-medium mb-2">⚠️ success.json</h4>
            <p className="text-xs text-muted-foreground mb-3">성공</p>
            <LottieLoadingCompact
              animationPath="/lottie/success.json"
              size="md"
            />
          </div>

          <div className="text-center p-4 border rounded-lg">
            <h4 className="font-medium mb-2">⚠️ warning.json</h4>
            <p className="text-xs text-muted-foreground mb-3">경고</p>
            <LottieLoadingCompact
              animationPath="/lottie/warning.json"
              size="md"
            />
          </div>

          <div className="text-center p-4 border rounded-lg">
            <h4 className="font-medium mb-2">⚠️ profile.json</h4>
            <p className="text-xs text-muted-foreground mb-3">프로필 설정</p>
            <LottieLoadingCompact
              animationPath="/lottie/profile.json"
              size="md"
            />
          </div>
        </CardContent>
      </Card>

      {/* 크기별 테스트 */}
      <Card>
        <CardHeader>
          <CardTitle>📏 크기별 애니메이션 테스트</CardTitle>
          <CardDescription>
            동일한 애니메이션을 다양한 크기로 테스트
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {[
              { file: "admin_error.json", name: "관리자 에러", emoji: "🔧" },
              { file: "no_result.json", name: "결과 없음", emoji: "🔍" },
              { file: "timeout.json", name: "타임아웃", emoji: "⏰" },
            ].map((item) => (
              <div key={item.file} className="space-y-2">
                <h4 className="font-medium">
                  {item.emoji} {item.name}
                </h4>
                <div className="flex items-center justify-center gap-8 p-4 bg-muted/30 rounded-lg">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground mb-2">Small</p>
                    <LottieLoadingCompact
                      animationPath={`/lottie/${item.file}`}
                      size="sm"
                    />
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground mb-2">Medium</p>
                    <LottieLoadingCompact
                      animationPath={`/lottie/${item.file}`}
                      size="md"
                    />
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground mb-2">Large</p>
                    <LottieLoadingCompact
                      animationPath={`/lottie/${item.file}`}
                      size="lg"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 기본 Lottie 로딩 */}
      <Card>
        <CardHeader>
          <CardTitle>기본 Lottie 로딩</CardTitle>
          <CardDescription>
            일반적인 크기의 Lottie 애니메이션 로딩
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LottieLoading
            text="데이터를 불러오는 중입니다"
            subText="잠시만 기다려주세요"
            size="md"
          />
        </CardContent>
      </Card>

      {/* 컴팩트 버전 */}
      <Card>
        <CardHeader>
          <CardTitle>컴팩트 Lottie 로딩</CardTitle>
          <CardDescription>
            작은 영역에 적합한 컴팩트한 로딩 애니메이션
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center gap-8">
            <div>
              <h4 className="text-sm font-medium mb-2">Small</h4>
              <LottieLoadingCompact size="sm" text="로딩중..." />
            </div>
            <div>
              <h4 className="text-sm font-medium mb-2">Medium</h4>
              <LottieLoadingCompact size="md" text="데이터 로딩중..." />
            </div>
            <div>
              <h4 className="text-sm font-medium mb-2">Large</h4>
              <LottieLoadingCompact size="lg" text="파일 업로드중..." />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 텍스트 없는 버전 */}
      <Card>
        <CardHeader>
          <CardTitle>애니메이션만 (텍스트 없음)</CardTitle>
          <CardDescription>로딩 텍스트 없이 애니메이션만 표시</CardDescription>
        </CardHeader>
        <CardContent>
          <LottieLoading size="lg" showText={false} />
        </CardContent>
      </Card>

      {/* 테스트 버튼들 */}
      <Card>
        <CardHeader>
          <CardTitle>전체 화면 테스트</CardTitle>
          <CardDescription>
            전체 화면 로딩 애니메이션을 테스트해보세요
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button onClick={() => setShowFullScreen(true)}>
              전체 화면 Lottie 로딩 테스트
            </Button>
            <Button variant="outline" onClick={() => setShowPageLoading(true)}>
              PageLoading (Lottie) 테스트
            </Button>
          </div>

          <div className="text-sm text-muted-foreground">
            <p>• 전체 화면 버튼: LottieLoadingFullScreen 컴포넌트 테스트</p>
            <p>
              • PageLoading 버튼: 기존 PageLoading에 lottie variant 적용 테스트
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 실제 사용 사례 */}
      <Card>
        <CardHeader>
          <CardTitle>🎪 실제 사용 사례</CardTitle>
          <CardDescription>
            프로젝트에서 실제로 사용되는 애니메이션 상황별 데모
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 페이지 로딩 시나리오 */}
            <div className="space-y-4 p-4 border rounded-lg">
              <h4 className="font-medium">📄 페이지 로딩</h4>
              <div className="bg-muted/30 p-4 rounded">
                <LottieLoadingCompact
                  animationPath="/lottie/cat_loading.json"
                  size="md"
                  text="페이지를 불러오는 중..."
                />
              </div>
              <code className="text-xs block p-2 bg-muted rounded">
                PageLoading variant="lottie"
              </code>
            </div>

            {/* 에러 상황 */}
            <div className="space-y-4 p-4 border rounded-lg">
              <h4 className="font-medium">❌ 관리자 에러</h4>
              <div className="bg-red-50 p-4 rounded">
                <LottieLoadingCompact
                  animationPath="/lottie/admin_error.json"
                  size="md"
                />
              </div>
              <code className="text-xs block p-2 bg-muted rounded">
                AdminError 컴포넌트
              </code>
            </div>

            {/* 타임아웃 상황 */}
            <div className="space-y-4 p-4 border rounded-lg">
              <h4 className="font-medium">⏰ 타임아웃</h4>
              <div className="bg-orange-50 p-4 rounded">
                <LottieLoadingCompact
                  animationPath="/lottie/timeout.json"
                  size="md"
                />
              </div>
              <code className="text-xs block p-2 bg-muted rounded">
                AdminError isTimeout={true}
              </code>
            </div>

            {/* 빈 상태 */}
            <div className="space-y-4 p-4 border rounded-lg">
              <h4 className="font-medium">🔍 결과 없음</h4>
              <div className="bg-gray-50 p-4 rounded">
                <LottieLoadingCompact
                  animationPath="/lottie/no_result.json"
                  size="md"
                />
              </div>
              <code className="text-xs block p-2 bg-muted rounded">
                EmptyFarmsState
              </code>
            </div>

            {/* 네트워크 오류 */}
            <div className="space-y-4 p-4 border rounded-lg">
              <h4 className="font-medium">📡 연결 없음</h4>
              <div className="bg-blue-50 p-4 rounded">
                <LottieLoadingCompact
                  animationPath="/lottie/no_connection.json"
                  size="md"
                />
              </div>
              <code className="text-xs block p-2 bg-muted rounded">
                오프라인 페이지
              </code>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 사용법 안내 */}
      <Card>
        <CardHeader>
          <CardTitle>📚 사용법 안내</CardTitle>
          <CardDescription>
            다양한 상황에서 Lottie 로딩을 사용하는 방법
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted p-4 rounded-lg">
            <h4 className="font-medium mb-2">1. 기본 로딩</h4>
            <code className="text-sm">
              {`<LottieLoadingCompact text="로딩중..." size="md" />`}
            </code>
          </div>

          <div className="bg-muted p-4 rounded-lg">
            <h4 className="font-medium mb-2">2. 페이지 로딩</h4>
            <code className="text-sm">
              {`<PageLoading variant="lottie" text="페이지 로딩중..." />`}
            </code>
          </div>

          <div className="bg-muted p-4 rounded-lg">
            <h4 className="font-medium mb-2">3. 에러 상황</h4>
            <code className="text-sm">{`<AdminError isTimeout={true} />`}</code>
          </div>

          <div className="bg-muted p-4 rounded-lg">
            <h4 className="font-medium mb-2">4. 커스텀 애니메이션</h4>
            <code className="text-sm">
              {`<LottieLoadingCompact animationPath="/lottie/custom.json" />`}
            </code>
          </div>

          <div className="bg-muted p-4 rounded-lg">
            <h4 className="font-medium mb-2">5. 크기 옵션</h4>
            <code className="text-sm">{`size="sm" | "md" | "lg"`}</code>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
