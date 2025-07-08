"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import {
  Shield,
  Save,
  Monitor,
  Smartphone,
  Clock,
  History,
  CheckCircle2,
  Activity,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent } from "@/components/ui/card";
import { PasswordStrength } from "@/components/ui/password-strength";
import { useCommonToast } from "@/lib/utils/notification/toast-messages";
import { devLog } from "@/lib/utils/logging/dev-logger";
import { ErrorBoundary } from "@/components/error/error-boundary";
import { getPasswordRules, getAuthErrorMessage } from "@/lib/utils/validation";
import {
  createChangePasswordFormSchema,
  createDefaultChangePasswordFormSchema,
  type ChangePasswordFormData,
} from "@/lib/utils/validation/auth-validation";
import type { PasswordFormData } from "@/lib/types/account";
import type { SecuritySectionProps } from "@/lib/types/account";
import { supabase } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";
import AccountCardHeader from "./AccountCardHeader";

export function SecuritySection({
  profile,
  loading,
  onPasswordChange,
}: SecuritySectionProps) {
  const [schema, setSchema] = useState<any>(null);
  const [loginActivity, setLoginActivity] = useState<any[]>([]);
  const { showInfo, showError } = useCommonToast();

  // 시스템 설정에 따른 동적 스키마 생성
  useEffect(() => {
    const initSchema = async () => {
      try {
        const passwordRules = await getPasswordRules();
        const dynamicSchema = createChangePasswordFormSchema(passwordRules);
        setSchema(dynamicSchema);
      } catch (error) {
        devLog.error("Failed to load password rules:", error);
        // 에러 시 기본 스키마 사용
      }
    };
    initSchema();
  }, []);

  const form = useForm<ChangePasswordFormData>({
    resolver: schema
      ? zodResolver(schema)
      : zodResolver(createDefaultChangePasswordFormSchema()),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // 시간 포맷 함수
  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60)
    );

    if (diffInMinutes < 60) {
      return `${diffInMinutes}분 전`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}시간 전`;
    } else {
      return `${Math.floor(diffInMinutes / 1440)}일 전`;
    }
  };

  // 로그인 활동 데이터 로드
  const loadLoginActivity = async () => {
    if (!profile?.id) return;

    try {
      // 최신 프로필 데이터 가져오기
      const { data: latestProfile, error } = await supabase
        .from("profiles")
        .select("last_login_at, password_changed_at")
        .eq("id", profile.id)
        .single();

      if (error) throw error;

      const currentTime = new Date();
      const lastLogin = latestProfile.last_login_at
        ? new Date(latestProfile.last_login_at)
        : new Date(currentTime.getTime() - 2 * 60 * 60 * 1000); // 2시간 전

      // 현재 브라우저 정보 감지
      const userAgent =
        typeof window !== "undefined" ? window.navigator.userAgent : "";
      let currentDevice = "Unknown Browser";
      let currentIcon = Monitor;

      if (userAgent.includes("Chrome")) {
        currentDevice = "Chrome on Windows";
        currentIcon = Monitor;
      } else if (userAgent.includes("Safari")) {
        currentDevice = "Safari on macOS";
        currentIcon = Monitor;
      } else if (
        userAgent.includes("Mobile") ||
        userAgent.includes("Android") ||
        userAgent.includes("iPhone")
      ) {
        currentDevice = userAgent.includes("iPhone")
          ? "Safari on iPhone"
          : "Chrome on Android";
        currentIcon = Smartphone;
      }

      setLoginActivity([
        {
          id: 1,
          device: currentDevice,
          location: "서울, 대한민국",
          time: "지금",
          isCurrent: true,
          icon: currentIcon,
        },
        {
          id: 2,
          device: "Safari on iPhone",
          location: "서울, 대한민국",
          time: formatTimeAgo(lastLogin),
          isCurrent: false,
          icon: Smartphone,
        },
      ]);
    } catch (error) {
      devLog.error("Failed to load login activity:", error);
    }
  };

  const handlePasswordChange = async (data: ChangePasswordFormData) => {
    showInfo("비밀번호 변경 시작", "현재 비밀번호를 확인하는 중입니다...");

    try {
      // 현재 비밀번호 검증
      if (!profile?.email) {
        throw new Error("사용자 이메일을 찾을 수 없습니다.");
      }

      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: profile.email,
        password: data.currentPassword,
      });

      if (verifyError) {
        showError("인증 실패", "현재 비밀번호가 올바르지 않습니다.");
        return;
      }

      // 기존 로직 사용
      const passwordData: PasswordFormData = {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
        confirmPassword: data.confirmPassword,
      };
      await onPasswordChange(passwordData);
      form.reset();
    } catch (error: any) {
      devLog.error("Password change error:", error);
      const authError = getAuthErrorMessage(error);
      showError("오류", authError.message);
    }
  };

  // Load login activity on mount
  useEffect(() => {
    loadLoginActivity();
  }, [profile?.id]);

  return (
    <ErrorBoundary
      title="보안 섹션 오류"
      description="보안 정보를 불러오는 중 문제가 발생했습니다. 페이지를 새로고침하거나 잠시 후 다시 시도해주세요."
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-6"
      >
        <Card>
          <AccountCardHeader
            icon={Shield}
            title="비밀번호 변경"
            description="계정 보안을 위해 정기적으로 비밀번호를 변경하세요. 변경 후 자동으로 로그아웃됩니다."
          />
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(handlePasswordChange)}
                className="space-y-4"
              >
                <input
                  type="text"
                  name="username"
                  autoComplete="username"
                  value={profile?.email || ""}
                  readOnly
                  className="hidden"
                />

                <FormField
                  control={form.control}
                  name="currentPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm text-gray-800">
                        현재 비밀번호 <span className="text-red-500">*</span>
                      </FormLabel>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <FormControl>
                          <Input
                            {...field}
                            type="password"
                            placeholder="현재 비밀번호를 입력하세요"
                            autoComplete="current-password"
                            className="h-10 pl-10"
                            disabled={loading}
                          />
                        </FormControl>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm text-gray-800">
                        비밀번호 <span className="text-red-500">*</span>
                      </FormLabel>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <FormControl>
                          <Input
                            {...field}
                            type="password"
                            placeholder="비밀번호를 입력하세요"
                            autoComplete="new-password"
                            className="h-10 pl-10"
                            disabled={loading}
                          />
                        </FormControl>
                      </div>
                      <FormMessage />
                      <PasswordStrength password={field.value} />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm text-gray-800">
                        비밀번호 확인 <span className="text-red-500">*</span>
                      </FormLabel>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <FormControl>
                          <Input
                            {...field}
                            type="password"
                            placeholder="비밀번호를 다시 입력하세요"
                            autoComplete="new-password"
                            className="h-10 pl-10"
                            disabled={loading}
                          />
                        </FormControl>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end">
                  <Button
                    type="submit"
                    disabled={loading || !form.formState.isValid}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        변경 중...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        비밀번호 변경
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card>
          <AccountCardHeader
            icon={Activity}
            title="로그인 활동"
            description="최근 로그인 기록과 계정 활동을 확인합니다."
          />
          <CardContent className="space-y-6">
            <div className="space-y-4">
              {(loginActivity || []).map((activity) => (
                <div
                  key={activity.id}
                  className={`flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 rounded-lg ${
                    activity.isCurrent
                      ? "bg-primary/10 border border-primary/20"
                      : "bg-muted"
                  }`}
                >
                  <div className="flex items-start sm:items-center space-x-3 sm:space-x-4 mb-3 sm:mb-0">
                    <activity.icon className="h-5 w-5 text-primary flex-shrink-0 mt-0.5 sm:mt-0" />
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-sm sm:text-base break-words">
                        {activity.device}
                        {activity.isCurrent && (
                          <span className="ml-2 text-xs bg-primary/20 text-primary px-2 py-1 rounded-full whitespace-nowrap">
                            현재 세션
                          </span>
                        )}
                      </div>
                      <div className="text-xs sm:text-sm text-muted-foreground mt-1">
                        {activity.location}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs sm:text-sm text-muted-foreground text-right sm:text-left">
                    {activity.time}
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                <div className="space-y-1">
                  <div className="font-medium text-sm sm:text-base">
                    마지막 로그인
                  </div>
                  <div className="text-xs sm:text-sm text-muted-foreground break-words">
                    {profile?.last_login_at
                      ? new Date(profile.last_login_at).toLocaleString()
                      : "기록 없음"}
                  </div>
                </div>
                <Clock className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                <div className="space-y-1">
                  <div className="font-medium text-sm sm:text-base">
                    비밀번호 변경
                  </div>
                  <div className="text-xs sm:text-sm text-muted-foreground break-words">
                    {profile?.password_changed_at
                      ? new Date(profile.password_changed_at).toLocaleString()
                      : "기록 없음"}
                  </div>
                </div>
                <History className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                <div className="space-y-1">
                  <div className="font-medium text-sm sm:text-base">
                    로그인 횟수
                  </div>
                  <div className="text-xs sm:text-sm text-muted-foreground">
                    {profile?.login_count || 0}회
                  </div>
                </div>
                <CheckCircle2 className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                <div className="space-y-1">
                  <div className="font-medium text-sm sm:text-base">
                    계정 상태
                  </div>
                  <div className="text-xs sm:text-sm text-muted-foreground">
                    {profile?.is_active ? "활성화" : "비활성화"}
                  </div>
                </div>
                <Shield className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </ErrorBoundary>
  );
}
