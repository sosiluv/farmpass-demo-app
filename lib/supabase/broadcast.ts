// Supabase Broadcast 공통 유틸
// 사용 예시: await sendSupabaseBroadcast({ channel, event, payload })

import * as Sentry from "@sentry/node";
import { devLog } from "@/lib/utils/logging/dev-logger";

export type BroadcastParams = {
  channel: string;
  event: string;
  payload: any;
};

export async function sendSupabaseBroadcast({
  channel,
  event,
  payload,
}: BroadcastParams) {
  try {
    const { createServiceRoleClient } = await import("./service-role");
    const supabase = createServiceRoleClient();
    await supabase.channel(channel).send({
      type: "broadcast",
      event,
      payload,
    });
    // 브로드캐스트 성공 로그
    devLog.log(`[BROADCAST SUCCESS] ${channel} - ${event} 발송 완료`);
  } catch (error) {
    // 공통 에러 로깅
    devLog.error(`[BROADCAST ERROR] ${channel} - ${event} 발송 실패:`, error);
    // Sentry로 에러 전송
    Sentry.captureException(error, {
      tags: {
        broadcast_channel: channel,
        broadcast_event: event,
      },
      extra: {
        payload,
      },
    });
  }
}
