"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/components/providers/auth-provider";
import { useAuthActions } from "@/hooks/auth/useAuthActions";
import { useProfileQuery } from "@/lib/hooks/query/use-profile-query";
import { useUpdateProfileMutation } from "@/lib/hooks/query/use-account-mutations";
import { useUpdateUserConsentsMutation } from "@/lib/hooks/query/use-user-consents-query";
import { Button } from "@/components/ui/button";
import { Form, FormField } from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageLoading } from "@/components/ui/loading";
import { ErrorBoundary } from "@/components/error/error-boundary";
import { ERROR_CONFIGS } from "@/lib/constants/error";
import { useCommonToast } from "@/lib/utils/notification/toast-messages";
import { Loader2 } from "lucide-react";
import { useRegistrationStore } from "@/store/use-registration-store";
import { TermsConsentSheet, NameField, PhoneField } from "@/components/auth";
import { isProfileComplete } from "@/lib/utils/auth/profile-utils";
import {
  nameSchema,
  phoneSchema,
} from "@/lib/utils/validation/profile-validation";
import { BUTTONS, LABELS } from "@/lib/constants/common";
import * as z from "zod";
import { motion } from "framer-motion";
import { Logo } from "@/components/common/logo";
import Link from "next/link";

// 프로필 폼 스키마
const profileFormSchema = z.object({
  name: nameSchema,
  phone: phoneSchema,
});

type ProfileFormData = z.infer<typeof profileFormSchema>;

export default function ProfileSetupPage() {
  const { state } = useAuth();
  const router = useRouter();
  const { showSuccess, showError } = useCommonToast();
  const { signOut } = useAuthActions();

  const [isLoading, setIsLoading] = useState(false);
  const [showConsentSheet, setShowConsentSheet] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Zustand store 사용
  const { setProfile, setConsents, clearData } = useRegistrationStore();

  // Mutation 훅들
  const updateProfileMutation = useUpdateProfileMutation();
  const updateConsentMutation = useUpdateUserConsentsMutation();

  // 사용자 상태 확인
  const { data: profileData, isLoading: profileLoading } = useProfileQuery(
    state.status === "authenticated" ? state.user.id : undefined
  );

  // React Hook Form 설정
  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: "",
      phone: "",
    },
  });

  useEffect(() => {
    // 인증되지 않은 경우 로그인 페이지로 리다이렉트
    if (state.status === "unauthenticated") {
      router.replace("/auth/login");
      return;
    }

    // 로딩 중이면 대기
    if (profileLoading) {
      return;
    }

    // 기존 프로필 데이터가 있으면 폼에 설정
    if (profileData) {
      form.reset({
        name: profileData.name || "",
        phone: profileData.phone || "",
      });
    }

    setIsInitialized(true);
  }, [state.status, profileData, profileLoading, router, form]);

  // 프로필 저장 (메모리에만 저장하고 약관 동의 시트 띄우기)
  const handleSubmit = async (data: ProfileFormData) => {
    // 메모리에 프로필 정보 저장
    setProfile({
      name: data.name.trim(),
      phone: data.phone.trim(),
    });

    // 약관 동의 시트 띄우기
    setShowConsentSheet(true);
  };

  // 약관 동의 완료 처리 (프로필 입력 후)
  const handleConsentComplete = async (
    privacyConsent: boolean,
    termsConsent: boolean,
    marketingConsent: boolean
  ) => {
    setIsLoading(true);
    try {
      // 약관 동의 정보를 메모리에 저장
      setConsents({
        privacyConsent,
        termsConsent,
        marketingConsent,
      });

      // 1. 프로필 정보 저장 (사용자가 입력한 정보가 있는 경우)
      const formData = form.getValues();
      const hasProfileChanges = formData.name.trim() || formData.phone.trim();

      if (hasProfileChanges) {
        const updateData = {
          name: formData.name.trim(),
          phone: formData.phone.trim(),
        };
        await updateProfileMutation.mutateAsync(updateData);
      }

      // 2. 약관 동의 정보 저장
      await updateConsentMutation.mutateAsync({
        privacyConsent,
        termsConsent,
        marketingConsent,
      });

      // 3. 임시 데이터 삭제
      clearData();

      showSuccess(
        "완료",
        hasProfileChanges
          ? "프로필 정보와 약관 동의가 성공적으로 저장되었습니다."
          : "약관 동의가 성공적으로 저장되었습니다."
      );

      // 대시보드로 리다이렉트
      setTimeout(() => {
        router.replace("/admin/dashboard");
      }, 1000);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "저장 중 오류가 발생했습니다.";
      showError("저장 실패", errorMessage);
    } finally {
      setIsLoading(false);
      setShowConsentSheet(false);
    }
  };

  // 뒤로가기 처리
  const handleGoBack = async () => {
    try {
      // 약관 동의 시트가 열려있으면 먼저 닫기
      if (showConsentSheet) {
        setShowConsentSheet(false);
        return;
      }

      // 로그아웃 처리 후 로그인 페이지로 리다이렉트
      await signOut();
      router.replace("/auth/login");
    } catch (error) {
      console.error("로그아웃 실패:", error);
      // 로그아웃 실패 시에도 로그인 페이지로 리다이렉트
      router.replace("/auth/login");
    }
  };

  // 로딩 중이거나 인증 확인 중인 경우
  if (state.status === "loading" || profileLoading || !isInitialized) {
    return (
      <PageLoading
        text={LABELS.PROFILE_SETUP_LOADING_TEXT}
        variant="lottie"
        fullScreen={true}
      />
    );
  }

  return (
    <ErrorBoundary
      title={ERROR_CONFIGS.LOADING.title}
      description={ERROR_CONFIGS.LOADING.description}
    >
      <div className="flex min-h-screen items-center justify-center bg-gradient-farm p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* 프로필이 완성된 경우 약관 동의 안내 */}
          {profileData && isProfileComplete(profileData) ? (
            <Card className="border-none shadow-soft-lg">
              <CardHeader className="space-y-1 text-center">
                <div className="mx-auto mb-4 flex justify-center">
                  <Logo size="xl" />
                </div>
                <CardTitle className="text-2xl">
                  {LABELS.PROFILE_SETUP_CONSENT_REQUIRED_TITLE}
                </CardTitle>
                <CardDescription>
                  {LABELS.PROFILE_SETUP_CONSENT_REQUIRED_DESC}
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <Button
                  onClick={() => setShowConsentSheet(true)}
                  disabled={isLoading}
                  className="w-full h-12 text-base font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {BUTTONS.PROFILE_SETUP_PROCESSING}
                    </>
                  ) : (
                    BUTTONS.PROFILE_SETUP_CONSENT_TERMS
                  )}
                </Button>
              </CardContent>
              <CardFooter className="flex justify-center">
                <p className="text-sm text-muted-foreground">
                  <Link
                    href="#"
                    onClick={handleGoBack}
                    className="font-medium text-primary hover:underline"
                  >
                    {BUTTONS.PROFILE_SETUP_GO_BACK}
                  </Link>
                </p>
              </CardFooter>
            </Card>
          ) : (
            <Card className="border-none shadow-soft-lg">
              <CardHeader className="space-y-1 text-center">
                <div className="mx-auto mb-4 flex justify-center">
                  <Logo size="xl" />
                </div>
                <CardTitle className="text-2xl">
                  {LABELS.PROFILE_SETUP_PROFILE_INPUT_TITLE}
                </CardTitle>
                <CardDescription>
                  {LABELS.PROFILE_SETUP_PROFILE_INPUT_DESC}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(handleSubmit)}
                    className="space-y-6"
                  >
                    {/* 이름 입력 */}
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <NameField field={field} loading={isLoading} />
                      )}
                    />

                    {/* 연락처 입력 */}
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <PhoneField field={field} loading={isLoading} />
                      )}
                    />

                    {/* 제출 버튼 */}
                    <Button
                      type="submit"
                      disabled={isLoading || !form.formState.isValid}
                      className="h-12 w-full flex items-center justify-center"
                    >
                      {isLoading
                        ? BUTTONS.PROFILE_SETUP_SAVING
                        : BUTTONS.PROFILE_SETUP_NEXT}
                    </Button>
                  </form>
                </Form>
              </CardContent>
              <CardFooter className="flex flex-col">
                <div className="mt-2 text-center text-sm">
                  <Link
                    href="#"
                    onClick={handleGoBack}
                    className="text-primary hover:underline"
                  >
                    {BUTTONS.PROFILE_SETUP_GO_BACK}
                  </Link>
                </div>
              </CardFooter>
            </Card>
          )}

          {/* 약관 동의 시트 */}
          <TermsConsentSheet
            open={showConsentSheet}
            onOpenChange={setShowConsentSheet}
            onConsent={handleConsentComplete}
            loading={isLoading}
            mode={
              profileData && isProfileComplete(profileData)
                ? "reconsent"
                : "register"
            }
          />
        </motion.div>
      </div>
    </ErrorBoundary>
  );
}
