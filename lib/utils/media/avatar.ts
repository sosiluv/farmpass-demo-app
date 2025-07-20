/**
 * 아바타 관련 유틸리티 함수들
 */

/**
 * 사용자 프로필에서 아바타 URL을 가져오는 함수
 * 우선순위: 1. 업로드된 이미지 2. 커스텀 seed 3. 기본 아바타
 */
// 아바타 URL을 가져올 수 있는 객체의 타입
type AvatarUser = {
  profile_image_url?: string | null;
  avatar_seed?: string | null;
  name?: string | null;
};

export function getAvatarUrl(
  user: AvatarUser | null | undefined,
  options?: {
    size?: number;
  }
): string {
  if (!user) {
    return generateDefaultAvatarUrl();
  }

  // 1. 업로드된 프로필 이미지가 있으면 사용
  if (user.profile_image_url) {
    return user.profile_image_url;
  }

  // 2. 커스텀 아바타 seed가 있으면 사용
  if (user.avatar_seed) {
    return generateAvatarUrl(user.avatar_seed, options);
  }

  // 3. 기본 아바타 (이름 기반)
  return generateAvatarUrl(user.name, options);
}

/**
 * 이름에서 이니셜을 생성하는 함수
 * 한글과 영문을 모두 지원
 */
export function generateInitials(name: string | null | undefined): string {
  if (!name || typeof name !== "string") {
    return "?";
  }

  const trimmedName = name.trim();
  if (!trimmedName) {
    return "?";
  }

  // 한글인 경우 첫 글자(성) 사용
  const koreanRegex = /[가-힣]/;
  if (koreanRegex.test(trimmedName)) {
    return trimmedName.charAt(0);
  }

  // 영문인 경우 첫 글자들 조합
  const words = trimmedName.split(" ").filter((word) => word.length > 0);
  if (words.length === 1) {
    return words[0].charAt(0).toUpperCase();
  }

  return words
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("");
}

/**
 * Dicebear API를 사용한 아바타 URL 생성
 * 이름 기반 또는 커스텀 seed 기반 모두 지원
 */
export function generateAvatarUrl(
  seed: string | null | undefined,
  options?: {
    size?: number;
  }
): string {
  if (!seed || typeof seed !== "string") {
    return generateDefaultAvatarUrl();
  }

  const trimmedSeed = seed.trim();
  if (!trimmedSeed) {
    return generateDefaultAvatarUrl();
  }

  const size = options?.size || 128;

  // Dicebear API 사용 (avataaars 스타일)
  const baseUrl = "https://api.dicebear.com/9.x";
  const params = new URLSearchParams({
    seed: trimmedSeed,
    size: size.toString(),
    backgroundColor: "b6e3f4,c0aede,ffdfbf",
    radius: "50",
  });

  // 이름 기반인 경우에만 성별 추정 적용
  if (trimmedSeed.length < 20 && !trimmedSeed.includes("-")) {
    // 이름으로 추정되는 경우 (짧고 하이픈이 없는 경우)
    const gender = estimateGenderFromName(trimmedSeed);

    // 성별에 따른 추가 옵션
    switch (gender) {
      case "female":
        params.append(
          "top",
          "bigHair,bob,bun,curly,curvy,dreads01,dreads02,frida,frizzle,fro,froBand,longButNotTooLong,miaWallace,shaggy,shaggyMullet,shavedSides,straight01,straight02,straightAndStrand"
        );
        break;
      case "male":
        params.append(
          "top",
          "shortCurly,shortFlat,shortRound,shortWaved,sides,theCaesar,theCaesarAndSidePart"
        );
        break;
      default:
        // 중성적 스타일 (모든 옵션 포함)
        params.append(
          "top",
          "bigHair,bob,bun,curly,curvy,dreads,dreads01,dreads02,frida,frizzle,fro,froBand,hat,longButNotTooLong,miaWallace,shaggy,shaggyMullet,shavedSides,shortCurly,shortFlat,shortRound,shortWaved,sides,straight01,straight02,straightAndStrand,theCaesar,theCaesarAndSidePart,winterHat1,winterHat02,winterHat03,winterHat04"
        );
        break;
    }
  }

  return `${baseUrl}/avataaars/svg?${params.toString()}`;
}

/**
 * 기본 아바타 URL 생성 (SVG)
 */
function generateDefaultAvatarUrl(): string {
  // 기본 사용자 아이콘 SVG
  return `data:image/svg+xml;base64,${btoa(`
    <svg width="128" height="128" viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="128" height="128" fill="#e5e7eb"/>
      <circle cx="64" cy="48" r="20" fill="#9ca3af"/>
      <path d="M24 96c0-22.091 17.909-40 40-40s40 17.909 40 40" fill="#9ca3af"/>
    </svg>
  `)}`;
}

/**
 * 한글 이름에서 성별을 추정하는 함수
 */
export function estimateGenderFromName(
  name: string
): "male" | "female" | "unknown" {
  if (!name || typeof name !== "string") return "unknown";

  const trimmedName = name.trim();

  // 한글 이름 패턴 (성 + 이름)
  const koreanNamePattern = /^[가-힣]{2,4}$/;
  if (!koreanNamePattern.test(trimmedName)) return "unknown";

  // 성별 구분이 어려운 이름들 (중성적)
  const neutralNames = [
    "민수",
    "지영",
    "민지",
    "서연",
    "현우",
    "준호",
    "지우",
    "민우",
    "지언",
    "현서",
    "서현",
    "민서",
  ];
  if (neutralNames.includes(trimmedName.slice(1))) return "unknown";

  // 여성 이름 패턴 (일반적으로 끝이 '영', '희', '미', '나' 등)
  const femaleEndings = [
    "영",
    "희",
    "미",
    "나",
    "은",
    "아",
    "이",
    "리",
    "라",
    "연",
    "현",
    "지",
    "수",
    "경",
    "숙",
    "순",
    "자",
    "정",
    "진",
    "주",
    "선",
    "영",
    "예",
    "은",
    "혜",
    "민",
    "서",
    "하",
    "윤",
    "유",
    "지",
    "수",
    "영",
    "미",
    "나",
    "은",
    "아",
    "이",
    "리",
    "라",
    "연",
    "현",
    "지",
    "수",
  ];
  const lastName = trimmedName.slice(1);

  if (femaleEndings.some((ending) => lastName.endsWith(ending))) {
    return "female";
  }

  // 남성 이름 패턴 (일반적으로 끝이 '수', '호', '준', '민' 등)
  const maleEndings = [
    "수",
    "호",
    "준",
    "민",
    "우",
    "현",
    "성",
    "철",
    "영",
    "태",
    "현",
    "재",
    "민",
    "훈",
    "석",
    "영",
    "철",
    "민",
    "준",
    "호",
    "우",
    "현",
    "성",
    "태",
    "재",
    "진",
    "주",
    "선",
    "영",
    "예",
    "은",
    "혜",
    "민",
    "서",
    "하",
    "윤",
    "유",
    "지",
    "수",
    "영",
    "미",
    "나",
    "은",
    "아",
    "이",
    "리",
    "라",
    "연",
    "현",
    "지",
    "수",
    "언",
    "원",
    "환",
    "찬",
    "준",
    "민",
    "우",
    "현",
    "성",
    "철",
    "영",
    "태",
    "재",
    "진",
    "주",
    "선",
    "영",
    "예",
    "은",
    "혜",
    "민",
    "서",
    "하",
    "윤",
    "유",
    "지",
    "수",
    "영",
    "미",
    "나",
    "은",
    "아",
    "이",
    "리",
    "라",
    "연",
    "현",
    "지",
    "수",
  ];
  if (maleEndings.some((ending) => lastName.endsWith(ending))) {
    return "male";
  }

  return "unknown";
}
