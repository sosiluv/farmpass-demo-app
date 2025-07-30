"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { Link, Unlink, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import AccountCardHeader from "./AccountCardHeader";
import { useSocialLinking } from "@/hooks/account/useSocialLinking";
import { SOCIAL_PROVIDERS } from "@/lib/constants/account";

interface SocialLinkingSectionProps {
  userId: string;
}

export function SocialLinkingSection({ userId }: SocialLinkingSectionProps) {
  const {
    identities,
    loading,
    linkingLoading,
    unlinkingLoading,
    canUnlink,
    fetchIdentities,
    handleLinkAccount,
    handleUnlinkAccount,
  } = useSocialLinking();

  useEffect(() => {
    fetchIdentities();
  }, [userId]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card>
        <AccountCardHeader
          icon={Link}
          title="소셜 계정 연동"
          description="다양한 소셜 계정을 연동하여 편리하게 로그인하세요"
        />
        <CardContent className="space-y-6">
          {/* 계정 연동 관리 */}
          <div className="space-y-3 sm:space-y-4">
            <h3 className="text-base sm:text-lg font-semibold">
              계정 연동 관리
            </h3>

            {loading ? (
              <div className="flex items-center justify-center py-6 sm:py-8">
                <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 animate-spin" />
                <span className="ml-2 text-sm sm:text-base">
                  계정 정보를 불러오는 중...
                </span>
              </div>
            ) : (
              <div className="space-y-3">
                {SOCIAL_PROVIDERS.map((provider) => {
                  const linkedIdentity = identities.find(
                    (identity) => identity.provider === provider.id
                  );
                  const isLinked = !!linkedIdentity;
                  const isLoading = linkingLoading === provider.id;
                  const isUnlinking = unlinkingLoading === linkedIdentity?.id;

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
                                연동됨
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
                                  "이메일 정보 없음"}
                              </p>
                              <p>
                                연동일:{" "}
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
                            disabled={!canUnlink || isUnlinking}
                            className="text-red-600 border-red-200 hover:bg-red-50 w-full sm:w-auto min-h-[40px] sm:min-h-[32px] text-sm"
                          >
                            {isUnlinking ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Unlink className="h-4 w-4" />
                            )}
                            <span className="ml-1 hidden sm:inline">
                              연동 해제
                            </span>
                            <span className="ml-1 sm:hidden">해제</span>
                          </Button>
                        ) : (
                          <Button
                            onClick={() => handleLinkAccount(provider.id)}
                            disabled={isLoading}
                            variant="outline"
                            size="sm"
                            className="w-full sm:w-auto min-h-[40px] sm:min-h-[32px] text-sm"
                          >
                            {isLoading ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                              <Link className="h-4 w-4 mr-2" />
                            )}
                            <span className="hidden sm:inline">연동하기</span>
                            <span className="sm:hidden">연동</span>
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
                      최소 1개의 로그인 방법을 유지해야 합니다
                    </p>
                    <p className="text-xs sm:text-sm text-yellow-700 mt-1">
                      다른 계정을 연동한 후에 현재 계정을 해제할 수 있습니다.
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
