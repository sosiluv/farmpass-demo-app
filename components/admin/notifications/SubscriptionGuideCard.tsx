import { Bell } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { memo } from "react";

function SubscriptionGuideCard() {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center">
            <Bell className="h-8 w-8 text-muted-foreground" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-medium text-muted-foreground">
              알림 설정을 위해 구독이 필요합니다
            </h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              위의 푸시 알림을 구독하시면 알림 방식과 종류를 세부적으로 설정할
              수 있습니다.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default memo(SubscriptionGuideCard);
