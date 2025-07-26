"use client";

import { useAuthenticatedMutation } from "@/lib/hooks/query-utils";
import { apiClient } from "@/lib/utils/data/api-client";
import { notificationKeys } from "./query-keys";
import { useQueryClient } from "@tanstack/react-query";
import type { NotificationsResponse } from "@/lib/types/notification";

/**
 * 알림 읽음 처리 Hook
 */
export function useMarkNotificationsReadMutation() {
  const queryClient = useQueryClient();

  return useAuthenticatedMutation(
    async (ids: string[]) => {
      const response = await apiClient("/api/notifications", {
        method: "PATCH",
        body: JSON.stringify({ ids }),
        context: "알림 읽음 처리",
      });
      return response;
    },
    {
      onSuccess: () => {
        // 알림 목록 캐시 무효화
        queryClient.invalidateQueries({
          queryKey: notificationKeys.lists(),
        });
      },
    }
  );
}

/**
 * 알림 삭제 Hook
 */
export function useDeleteNotificationsMutation() {
  const queryClient = useQueryClient();

  return useAuthenticatedMutation(
    async (ids: string[]) => {
      const response = await apiClient("/api/notifications", {
        method: "DELETE",
        body: JSON.stringify({ ids }),
        context: "알림 삭제",
      });
      return response;
    },
    {
      onSuccess: () => {
        // 알림 목록 캐시 무효화
        queryClient.invalidateQueries({
          queryKey: notificationKeys.lists(),
        });
      },
    }
  );
}

/**
 * 알림 더보기 Hook (페이지네이션)
 */
export function useLoadMoreNotifications() {
  const queryClient = useQueryClient();

  return useAuthenticatedMutation(
    async ({ page, pageSize }: { page: number; pageSize: number }) => {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
      });

      const response = await apiClient(
        `/api/notifications?${params.toString()}`,
        {
          method: "GET",
          context: "알림 더보기",
        }
      );

      return response;
    },
    {
      onSuccess: (newData, variables) => {
        // 기존 데이터에 새 데이터 추가
        queryClient.setQueryData(
          notificationKeys.list({
            page: variables.page,
            pageSize: variables.pageSize,
          }),
          (oldData: NotificationsResponse | undefined) => {
            if (!oldData) return newData;
            return {
              ...newData,
              notifications: [
                ...oldData.notifications,
                ...newData.notifications,
              ],
            };
          }
        );
      },
    }
  );
}
