"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/components/providers/auth-provider";
import { useProfileQuery } from "@/lib/hooks/query/use-profile-query";
import { useUserConsentsQuery } from "@/lib/hooks/query/use-user-consents-query";
import { useUpdateProfileMutation } from "@/lib/hooks/query/use-account-mutations";
import { useUpdateUserConsentsMutation } from "@/lib/hooks/query/use-user-consents-query";
import { Button } from "@/components/ui/button";
import { Form, FormField } from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageLoading } from "@/components/ui/loading";
import { ErrorBoundary } from "@/components/error/error-boundary";
import { ERROR_CONFIGS } from "@/lib/constants/error";
import { useCommonToast } from "@/lib/utils/notification/toast-messages";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useRegistrationStore } from "@/store/use-registration-store";
import { TermsConsentSheet, NameField, PhoneField } from "@/components/auth";
import { isProfileComplete } from "@/lib/utils/auth/profile-utils";
import {
  nameSchema,
  phoneNumberSchema,
} from "@/lib/utils/validation/profile-validation";
import { BUTTONS, LABELS } from "@/lib/constants/common";
import * as z from "zod";

// 프로필 폼 스키마
const profileFormSchema = z.object({
  name: nameSchema,
  phoneNumber: phoneNumberSchema,
});

type ProfileFormData = z.infer<typeof profileFormSchema>;

export default function ProfileSetupPage() {
  const { state } = useAuth();
  const router = useRouter();
  const { showSuccess, showError } = useCommonToast();

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
  const { data: consentData, isLoading: consentLoading } = useUserConsentsQuery(
    state.status === "authenticated"
  );

  // React Hook Form 설정
  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: "",
      phoneNumber: "",
    },
  });

  useEffect(() => {
    // 인증되지 않은 경우 로그인 페이지로 리다이렉트
    if (state.status === "unauthenticated") {
      router.replace("/auth/login");
      return;
    }

    // 로딩 중이면 대기
    if (profileLoading || consentLoading) {
      return;
    }

    // 이미 프로필이 완성된 경우
    if (profileData && isProfileComplete(profileData)) {
      // 약관 동의 상태 확인
      if (consentData?.hasAllRequiredConsents) {
        // 프로필과 약관 모두 완료된 경우 대시보드로 리다이렉트
        router.replace("/admin/dashboard");
        return;
      } else {
        // 프로필은 완성되었지만 약관 동의가 필요한 경우
        // 약관 동의 시트를 바로 표시
        setShowConsentSheet(true);
        setIsInitialized(true);
        return;
      }
    }

    // 기존 프로필 데이터가 있으면 폼에 설정
    if (profileData) {
      form.reset({
        name: profileData.name || "",
        phoneNumber: profileData.phone || "",
      });
    }

    setIsInitialized(true);
  }, [
    state.status,
    profileData,
    consentData,
    profileLoading,
    consentLoading,
    router,
    form,
  ]);

  // 프로필 저장 (메모리에만 저장하고 약관 동의 시트 띄우기)
  const handleSubmit = async (data: ProfileFormData) => {
    // 메모리에 프로필 정보 저장
    setProfile({
      name: data.name.trim(),
      phoneNumber: data.phoneNumber.trim(),
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

      // 1. 프로필 정보 저장 (프로필이 미완성인 경우에만)
      if (!profileData || !isProfileComplete(profileData)) {
        const formData = form.getValues();
        await updateProfileMutation.mutateAsync({
          name: formData.name.trim(),
          phoneNumber: formData.phoneNumber.trim(),
        });
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
        profileData && isProfileComplete(profileData)
          ? "약관 동의가 성공적으로 저장되었습니다."
          : "프로필 정보와 약관 동의가 성공적으로 저장되었습니다."
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
  const handleGoBack = () => {
    router.back();
  };

  // 로딩 중이거나 인증 확인 중인 경우
  if (
    state.status === "loading" ||
    profileLoading ||
    consentLoading ||
    !isInitialized ||
    // 프로필과 약관이 모두 완료된 경우도 로딩 상태로 처리하여 깜빡임 방지
    (profileData &&
      isProfileComplete(profileData) &&
      consentData?.hasAllRequiredConsents)
  ) {
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
        <div className="w-full max-w-md">
          {/* 뒤로가기 버튼 */}
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={handleGoBack}
              className="text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {BUTTONS.PROFILE_SETUP_GO_BACK}
            </Button>
          </div>

          {/* 프로필이 완성된 경우 약관 동의 안내 */}
          {profileData && isProfileComplete(profileData) ? (
            <Card className="shadow-lg">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl font-bold text-gray-900">
                  {LABELS.PROFILE_SETUP_CONSENT_REQUIRED_TITLE}
                </CardTitle>
                <CardDescription className="text-gray-600">
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
            </Card>
          ) : (
            <Card className="shadow-lg">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl font-bold text-gray-900">
                  {LABELS.PROFILE_SETUP_PROFILE_INPUT_TITLE}
                </CardTitle>
                <CardDescription className="text-gray-600">
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
                      name="phoneNumber"
                      render={({ field }) => (
                        <PhoneField field={field} loading={isLoading} />
                      )}
                    />

                    {/* 제출 버튼 */}
                    <Button
                      type="submit"
                      disabled={isLoading || !form.formState.isValid}
                      className="w-full h-12 text-base font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl"
                    >
                      {isLoading
                        ? BUTTONS.PROFILE_SETUP_SAVING
                        : BUTTONS.PROFILE_SETUP_NEXT}
                    </Button>
                  </form>
                </Form>
              </CardContent>
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
        </div>
      </div>
    </ErrorBoundary>
  );
}
