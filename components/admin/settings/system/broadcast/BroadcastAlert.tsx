import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

export function BroadcastAlert() {
  return (
    <Alert>
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription className="space-y-2">
        <p>
          <strong>주의:</strong> 이 기능은 선택한 알림 유형에 따라 해당 알림을
          구독한 사용자에게만 메시지를 발송합니다.
        </p>
        <ul className="text-sm list-disc list-inside space-y-1">
          <li>
            <strong>공지사항:</strong> 일반적인 공지나 안내사항을 구독한
            사용자에게 전송
          </li>
          <li>
            <strong>긴급 알림:</strong> 긴급 알림을 구독한 사용자에게 즉시 전송
          </li>
          <li>
            <strong>유지보수 알림:</strong> 시스템 점검이나 업데이트 알림을
            구독한 사용자에게 전송
          </li>
        </ul>
        <p className="text-sm mt-2">
          스팸성 메시지나 불필요한 알림은 사용자 경험을 해칠 수 있으니 신중하게
          사용해주세요.
        </p>
      </AlertDescription>
    </Alert>
  );
}
