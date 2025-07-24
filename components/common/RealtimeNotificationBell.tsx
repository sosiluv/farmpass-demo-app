"use client";

import { Bell } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  useNotificationStore,
  getNotificationId,
} from "@/store/use-notification-store";

export function RealtimeNotificationBell() {
  const notifications = useNotificationStore((s) => s.notifications);
  const unreadCount = notifications.filter((n) => !n.read).length;
  const markAllRead = useNotificationStore((s) => s.markAllRead);
  const markNotificationRead = useNotificationStore(
    (s) => s.markNotificationRead
  );
  const removeNotification = useNotificationStore((s) => s.removeNotification);

  return (
    <div className="fixed top-4 right-4 md:right-16 z-50">
      <Popover>
        <PopoverTrigger asChild>
          <button className="relative focus:outline-none" aria-label="알림">
            <Bell className="w-6 h-6" />
            {unreadCount > 0 && (
              <span
                className="absolute -top-2 -right-2 min-w-[18px] h-5 px-1 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center border-2 border-white shadow"
                style={{ lineHeight: 1 }}
              >
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-80">
          <div className="font-bold mb-2">실시간 알림</div>
          {notifications.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              알림이 없습니다.
            </div>
          ) : (
            <div className="max-h-72 overflow-y-auto divide-y">
              {notifications.map((n) => {
                const id = getNotificationId(n);
                return (
                  <div key={id} className="py-2 flex items-start gap-2 group">
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm break-all">
                        {n.title}
                      </div>
                      <div className="text-xs text-muted-foreground break-all">
                        {n.message}
                      </div>
                      {n.timestamp && (
                        <div className="text-[10px] text-gray-400 mt-0.5">
                          {new Date(n.timestamp).toLocaleString()}
                        </div>
                      )}
                    </div>
                    <button
                      className="ml-2 text-gray-400 hover:text-red-500 text-xs font-bold"
                      aria-label="알림 읽음 및 삭제"
                      style={{ minWidth: 20, fontSize: 18, lineHeight: 1 }}
                      onClick={() => {
                        markNotificationRead(id);
                        removeNotification(id);
                      }}
                    >
                      ×
                    </button>
                  </div>
                );
              })}
            </div>
          )}
          <button
            className="mt-2 text-xs text-primary underline"
            onClick={markAllRead}
          >
            모두 읽음 처리
          </button>
        </PopoverContent>
      </Popover>
    </div>
  );
}
