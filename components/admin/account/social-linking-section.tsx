"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Link, Unlink, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSocialLinkingQuery } from "@/lib/hooks/query/use-social-linking-query";
import { useSocialLinkingCallback } from "@/lib/hooks/query/use-social-linking-callback";
import { useCommonToast } from "@/lib/utils/notification/toast-messages";
import {
  SOCIAL_PROVIDERS,
  PAGE_HEADER,
  LABELS,
  BUTTONS,
} from "@/lib/constants/account";
import AccountCardHeader from "./AccountCardHeader";

interface SocialLinkingSectionProps {
  userId: string;
}

export function SocialLinkingSection({ userId }: SocialLinkingSectionProps) {
  const { showSuccess, showError, showInfo } = useCommonToast();

  // OAuth 리다이렉트 후 로딩 상태 유지를 위한 별도 상태
  const [linkingProvider, setLinkingProvider] = useState<string | null>(null);

  // 콜백 처리
  useSocialLinkingCallback();

  // 쿼리 및 뮤테이션
  const {
    identities,
    isLoading,
    isLinking: rqIsLinking,
    isUnlinking,
    canUnlink,
    linkAccount,
    unlinkAccount,
    linkError,
    unlinkError,
  } = useSocialLinkingQuery();

  // 실제 로딩 상태 (RQ + 수동 관리)
  const isLinking = rqIsLinking || !!linkingProvider;

  // 에러 처리
  useEffect(() => {
    if (linkError) {
      showError("계정 연동 실패", linkError.message);
      setLinkingProvider(null); // 에러 시 로딩 상태 해제
    }
    if (unlinkError) {
      showError("계정 연동 해제 실패", unlinkError.message);
    }
  }, [linkError, unlinkError, showError]);

  // 연동 해제 성공 처리 (isUnlinking이 false로 바뀔 때 감지)
  const prevIsUnlinking = useRef(isUnlinking);
  useEffect(() => {
    if (prevIsUnlinking.current && !isUnlinking && !unlinkError) {
      showSuccess("계정 연동 해제 완료", "소셜 계정 연동이 해제되었습니다.");
    }
    prevIsUnlinking.current = isUnlinking;
  }, [isUnlinking, unlinkError, showSuccess]);

  // 계정 목록이 업데이트되면 연동 로딩 상태 해제
  useEffect(() => {
    if (identities.length > 0 && linkingProvider) {
      // 새로운 계정이 추가되었는지 확인
      const hasNewAccount = identities.some(
        (identity) => identity.provider === linkingProvider
      );
      if (hasNewAccount) {
        setLinkingProvider(null);
      }
    }
  }, [identities, linkingProvider]);

  // 연동 시작 시 토스트 및 로딩 상태 설정
  const handleLinkAccount = (provider: string) => {
    showInfo("계정 연동 시작", `${provider} 계정을 연동하는 중입니다...`);
    setLinkingProvider(provider); // 로딩 상태 설정
    linkAccount(provider);
  };

  // 연동 해제 시작 시 토스트
  const handleUnlinkAccount = (identity: any) => {
    showInfo(
      "계정 연동 해제 시작",
      `${identity.provider} 계정 연동을 해제하는 중입니다...`
    );
    unlinkAccount(identity);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card>
        <AccountCardHeader
          icon={Link}
          title={PAGE_HEADER.SOCIAL_LINKING_TITLE}
          description={PAGE_HEADER.SOCIAL_LINKING_DESCRIPTION}
        />
        <CardContent className="space-y-6">
          {/* 계정 연동 관리 */}
          <div className="space-y-3 sm:space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-6 sm:py-8">
                <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 animate-spin" />
                <span className="ml-2 text-sm sm:text-base">
                  {LABELS.LOADING_ACCOUNT_INFO}
                </span>
              </div>
            ) : (
              <div className="space-y-3">
                {SOCIAL_PROVIDERS.map((provider) => {
                  const linkedIdentity = identities.find(
                    (identity) => identity.provider === provider.id
                  );
                  const isLinked = !!linkedIdentity;
                  const isProviderLinking = isLinking; // 현재 연동 중인지
                  const isProviderUnlinking = isUnlinking; // 현재 해제 중인지

                  return (
                    <div
                      key={provider.id}
                      className={`flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border rounded-lg gap-3 ${
                        isLinked
                          ? "bg-gray-50 border-gray-200"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-start sm:items-center space-x-3 min-w-0 flex-1">
                        <div
                          className={`p-2 rounded-lg flex-shrink-0 ${provider.color}`}
                        >
                          {provider.iconSrc ? (
                            <img
                              src={provider.iconSrc}
                              alt={`${provider.name} 아이콘`}
                              className="h-5 w-5"
                            />
                          ) : null}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="font-medium text-sm sm:text-base truncate">
                              {provider.name}
                            </span>
                            {isLinked && (
                              <Badge
                                variant="secondary"
                                className="text-xs flex-shrink-0"
                              >
                                {LABELS.LINKED}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs sm:text-sm text-muted-foreground mb-2">
                            {provider.description}
                          </p>
                          {isLinked && linkedIdentity && (
                            <div className="text-xs text-muted-foreground space-y-1">
                              <p className="truncate">
                                {linkedIdentity.identity_data?.email ||
                                  LABELS.EMAIL_INFO_UNAVAILABLE}
                              </p>
                              <p>
                                {LABELS.LINKING_DATE}:{" "}
                                {new Date(
                                  linkedIdentity.created_at
                                ).toLocaleDateString()}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-end sm:justify-start w-full sm:w-auto">
                        {isLinked ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUnlinkAccount(linkedIdentity!)}
                            disabled={!canUnlink || isProviderUnlinking}
                            className="text-red-600 border-red-200 hover:bg-red-50 w-full text-sm sm:text-base"
                          >
                            {isProviderUnlinking ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Unlink className="h-4 w-4" />
                            )}
                            <span className="ml-1 hidden sm:inline">
                              {BUTTONS.UNLINK_ACCOUNT}
                            </span>
                            <span className="ml-1 sm:hidden">
                              {BUTTONS.UNLINK_ACCOUNT_MOBILE}
                            </span>
                          </Button>
                        ) : (
                          <Button
                            onClick={() => handleLinkAccount(provider.id)}
                            disabled={isProviderLinking}
                            variant="outline"
                            size="sm"
                            className="w-full text-sm sm:text-base"
                          >
                            {isProviderLinking ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                              <Link className="h-4 w-4 mr-2" />
                            )}
                            <span>{BUTTONS.LINK_ACCOUNT_MOBILE}</span>
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* 안내 메시지 */}
            {!canUnlink && identities.length > 0 && (
              <div className="p-3 sm:p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-yellow-800">
                      {LABELS.MIN_LOGIN_METHOD_WARNING}
                    </p>
                    <p className="text-xs sm:text-sm text-yellow-700 mt-1">
                      {LABELS.MIN_LOGIN_METHOD_DESCRIPTION}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
