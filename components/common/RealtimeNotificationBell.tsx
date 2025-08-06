"use client";

import { Bell, Loader2, ChevronDown, Check, Trash2, X } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useNotificationsQuery } from "@/lib/hooks/query/use-notifications-query";
import {
  useMarkNotificationsReadMutation,
  useDeleteNotificationsMutation,
  useLoadMoreNotifications,
} from "@/lib/hooks/query/use-notifications-mutations";
import { LottieLoadingCompact } from "@/components/ui/lottie-loading";
import { BUTTONS, LABELS } from "@/lib/constants/common";
import type { Notification } from "@/lib/types/notification";

function getNotificationId(n: Notification) {
  return `${n.created_at}_${n.title}_${n.message}`;
}

export function RealtimeNotificationBell() {
  const router = useRouter();
  // React Query hooks 사용
  const { notifications, loading, page, totalPages } = useNotificationsQuery();
  const markReadMutation = useMarkNotificationsReadMutation();
  const deleteMutation = useDeleteNotificationsMutation();
  const loadMoreMutation = useLoadMoreNotifications();

  const unreadCount = notifications.filter((n) => !n.read).length;

  const [popoverOpen, setPopoverOpen] = useState(false);

  // 알림 타입에 따른 페이지 이동 함수
  const getNotificationRoute = (notification: Notification): string | null => {
    // 링크 정보가 있으면 사용, 없으면 null 반환
    return notification.link || null;
  };

  // 개별 알림 클릭 시 페이지 이동 및 읽음 처리
  const handleNotificationClick = async (n: Notification, id: string) => {
    await markReadMutation.mutateAsync([id]);
    setPopoverOpen(false); // 팝오버 닫기

    const route = getNotificationRoute(n);
    if (route) {
      router.push(route);
    }
  };

  // 전체 읽음 처리
  const handleMarkAllRead = async () => {
    const unreadIds = notifications
      .filter((n) => !n.read && n.id)
      .map((n) => n.id);
    if (unreadIds.length > 0) {
      await markReadMutation.mutateAsync(unreadIds);
    }
  };

  // 전체 삭제 처리
  const handleDeleteAllNotifications = async () => {
    const allIds = notifications.filter((n) => n.id).map((n) => n.id);
    if (allIds.length > 0) {
      await deleteMutation.mutateAsync(allIds);
    }
  };

  // 알림 삭제
  const handleDeleteNotification = async (id: string) => {
    await deleteMutation.mutateAsync([id]);
  };

  // 더보기
  const handleLoadMore = async () => {
    if (page < totalPages) {
      await loadMoreMutation.mutateAsync({ page: page + 1, pageSize: 20 });
    }
  };

  return (
    <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
      <PopoverTrigger asChild>
        <button
          className="relative p-2 rounded-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-0 focus:ring-offset-0 focus:ring-transparent focus:border-transparent"
          style={{ outline: "none" }}
          aria-label={LABELS.NOTIFICATION_TITLE}
        >
          <Bell className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          {unreadCount > 0 && (
            <span
              className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1.5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center border-2 border-white dark:border-gray-900 shadow-lg animate-pulse"
              style={{ lineHeight: 1 }}
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-80 p-0 border-0 shadow-2xl bg-white/95 dark:bg-gray-900/95 backdrop-blur-md rounded-xl focus:outline-none focus:ring-0 focus:ring-offset-0"
        style={{ outline: "none" }}
      >
        {/* 헤더 */}
        <div className="sticky top-0 z-10 px-4 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 border-b border-gray-200 dark:border-gray-600 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {LABELS.NOTIFICATION_TITLE}
              </h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs font-medium rounded-full">
                  {unreadCount}개
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 알림 목록 */}
        <div className="max-h-80 overflow-y-auto pr-2">
          {loading ? (
            <div className="p-8">
              <LottieLoadingCompact
                text={LABELS.NOTIFICATION_LOADING_TEXT}
                size="md"
              />
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {LABELS.NOTIFICATION_EMPTY}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {notifications.map((n) => {
                const id = n.id || getNotificationId(n);
                return (
                  <div
                    key={id}
                    className={`group relative p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all duration-200 ${
                      !n.read
                        ? "bg-blue-50/50 dark:bg-blue-900/20 border-l-4 border-blue-500"
                        : "bg-transparent"
                    }`}
                  >
                    {/* 읽음 표시 */}
                    {!n.read && (
                      <div className="absolute top-4 left-2 w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                    )}

                    {/* 알림 내용 */}
                    <div className="pl-4 pr-6">
                      <div
                        className={`text-sm font-medium cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors ${
                          !n.read
                            ? "text-gray-900 dark:text-white"
                            : "text-gray-700 dark:text-gray-300"
                        }`}
                        onClick={() => handleNotificationClick(n, id)}
                      >
                        {n.title}
                      </div>
                      <div
                        className="text-xs text-gray-600 dark:text-gray-400 cursor-pointer hover:text-gray-800 dark:hover:text-gray-200 mt-1 line-clamp-2"
                        onClick={() => handleNotificationClick(n, id)}
                      >
                        {n.message}
                      </div>
                      <div className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                        {new Date(n.created_at).toLocaleString()}
                      </div>
                    </div>

                    {/* 삭제 버튼 */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteNotification(id);
                      }}
                      className="absolute top-3 right-1 opacity-0 group-hover:opacity-100 transition-all duration-200 p-1.5 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                      aria-label={LABELS.NOTIFICATION_DELETE}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 푸터 */}
        {notifications.length > 0 && (
          <div className="sticky bottom-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-t border-gray-200 dark:border-gray-600 rounded-b-xl">
            <div className="p-3">
              {/* 액션 버튼들 */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex gap-1">
                  <button
                    onClick={handleMarkAllRead}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all duration-200"
                    disabled={unreadCount === 0}
                  >
                    <Check className="w-3 h-3" />
                    {BUTTONS.NOTIFICATION_MARK_ALL_READ}
                  </button>
                  <button
                    onClick={handleDeleteAllNotifications}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200"
                    disabled={notifications.length === 0}
                  >
                    <Trash2 className="w-3 h-3" />
                    {BUTTONS.NOTIFICATION_DELETE_ALL}
                  </button>
                </div>
                <div className="text-xs text-gray-400 dark:text-gray-500 font-medium">
                  {page} / {totalPages}
                </div>
              </div>

              {/* 더보기 버튼 */}
              {page < totalPages && (
                <button
                  onClick={handleLoadMore}
                  disabled={loadMoreMutation.isPending}
                  className="w-full py-2 text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loadMoreMutation.isPending ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin" />
                      {BUTTONS.NOTIFICATION_LOADING}
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-3 w-3" />
                      {BUTTONS.NOTIFICATION_LOAD_MORE}
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
