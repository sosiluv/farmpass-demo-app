/**
 * 프로필 완성도 체크 유틸리티 함수
 */

export interface Profile {
  name?: string;
  phone?: string | null;
  [key: string]: any;
}

/**
 * 프로필이 완성되었는지 확인하는 함수
 * @param profile - 프로필 객체
 * @returns 프로필 완성 여부
 */
export const isProfileComplete = (
  profile: Profile | null | undefined
): boolean => {
  if (!profile) return false;

  return !!(
    profile.name &&
    profile.name.trim() !== "" &&
    profile.phone &&
    profile.phone.trim() !== ""
  );
};
