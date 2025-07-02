import { CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/common";

interface SuccessCardProps {
  onClose: () => void;
}

export const SuccessCard = ({ onClose }: SuccessCardProps) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center text-green-600 flex items-center justify-center gap-2">
            <CheckCircle className="h-6 w-6" />
            등록 완료
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="space-y-3">
            <p className="text-lg font-semibold">방문 등록이 완료되었습니다!</p>
            <p className="text-sm text-muted-foreground">
              농장 관리자에게 알림이 전송되었습니다.
            </p>

            {/* 회사 브랜딩 */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 p-4 rounded-lg">
              <div className="text-center space-y-2">
                <Logo showText className="justify-center" />
                <p className="text-xs text-blue-600">
                  Powered by <span className="font-bold">SWK KOREA</span>
                </p>
              </div>
            </div>
          </div>

          <Badge variant="outline" className="text-sm">
            등록 시간: {new Date().toLocaleString("ko-KR")}
          </Badge>

          {/* 완료 안내 */}
          <div className="space-y-3 pt-4">
            <p className="text-sm text-gray-600">
              이제 안전하게 창을 닫으시거나 회사 정보를 확인해보세요.
            </p>
            <Button onClick={onClose} className="w-full">
              창 닫기
            </Button>
            <Button
              onClick={() => {
                window.open("http://www.swkukorea.com/", "_blank");
              }}
              variant="outline"
              size="lg"
              className="w-full"
            >
              회사 소개 보기
            </Button>
          </div>

          <div className="text-xs text-muted-foreground mt-4 space-y-1 text-center">
            <p>💡 추가 방문자가 있으시면 QR 코드를 다시 스캔해주세요.</p>
            <p>
              🌐 농장 출입 관리 시스템은{" "}
              <span className="font-semibold text-blue-600">SWK KOREA</span>
              에서 제공합니다.
            </p>
            <p className="text-gray-400">
              📱 모바일에서는 브라우저의 뒤로가기 버튼을 사용하세요.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
