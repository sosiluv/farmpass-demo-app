/**
 * 대한민국 지역 분류 유틸리티
 *
 * 주소 문자열을 분석하여 시/도 단위로 지역을 분류합니다.
 */

/**
 * 대한민국 시/도 목록
 */
export const KOREA_REGIONS = {
  // 특별시/광역시/특별자치시/특별자치도
  SEOUL: "서울특별시",
  BUSAN: "부산광역시",
  DAEGU: "대구광역시",
  INCHEON: "인천광역시",
  GWANGJU: "광주광역시",
  DAEJEON: "대전광역시",
  ULSAN: "울산광역시",
  SEJONG: "세종특별자치시",
  JEJU: "제주특별자치도",

  GYEONGGI: "경기도",
  GANGWON: "강원도",
  CHUNGBUK: "충청북도",
  CHUNGNAM: "충청남도",
  JEONBUK: "전라북도",
  JEONNAM: "전라남도",
  GYEONGBUK: "경상북도",
  GYEONGNAM: "경상남도",
} as const;

/**
 * 경기도 주요 시/군 목록
 */
export const GYEONGGI_CITIES = [
  "수원시",
  "성남시",
  "고양시",
  "용인시",
  "부천시",
  "안산시",
  "안양시",
  "남양주시",
  "화성시",
  "평택시",
  "의정부시",
  "시흥시",
  "파주시",
  "김포시",
  "광명시",
  "광주시",
  "군포시",
  "오산시",
  "이천시",
  "양주시",
  "구리시",
  "안성시",
  "포천시",
  "의왕시",
  "하남시",
  "여주시",
  "동두천시",
  "과천시",
  "양평군",
  "가평군",
  "연천군",
];

/**
 * 충청북도 주요 시/군 목록
 */
export const CHUNGBUK_CITIES = [
  "청주시",
  "충주시",
  "제천시",
  "보은군",
  "옥천군",
  "영동군",
  "증평군",
  "진천군",
  "괴산군",
  "음성군",
  "단양군",
];

/**
 * 충청남도 주요 시/군 목록
 */
export const CHUNGNAM_CITIES = [
  "천안시",
  "공주시",
  "보령시",
  "아산시",
  "서산시",
  "논산시",
  "계룡시",
  "당진시",
  "금산군",
  "부여군",
  "서천군",
  "청양군",
  "홍성군",
  "예산군",
  "태안군",
];

/**
 * 전라북도 주요 시/군 목록
 */
export const JEONBUK_CITIES = [
  "전주시",
  "군산시",
  "익산시",
  "정읍시",
  "남원시",
  "김제시",
  "완주군",
  "진안군",
  "무주군",
  "장수군",
  "임실군",
  "순창군",
  "고창군",
  "부안군",
];

/**
 * 전라남도 주요 시/군 목록
 */
export const JEONNAM_CITIES = [
  "목포시",
  "여수시",
  "순천시",
  "나주시",
  "광양시",
  "담양군",
  "곡성군",
  "구례군",
  "고흥군",
  "보성군",
  "화순군",
  "장흥군",
  "강진군",
  "해남군",
  "영암군",
  "무안군",
  "함평군",
  "영광군",
  "장성군",
  "완도군",
  "진도군",
  "신안군",
];

/**
 * 경상북도 주요 시/군 목록
 */
export const GYEONGBUK_CITIES = [
  "포항시",
  "경주시",
  "김천시",
  "안동시",
  "구미시",
  "영주시",
  "영천시",
  "상주시",
  "문경시",
  "경산시",
  "군위군",
  "의성군",
  "청송군",
  "영양군",
  "영덕군",
  "청도군",
  "고령군",
  "성주군",
  "칠곡군",
  "예천군",
  "봉화군",
  "울진군",
  "울릉군",
];

/**
 * 경상남도 주요 시/군 목록
 */
export const GYEONGNAM_CITIES = [
  "창원시",
  "진주시",
  "통영시",
  "사천시",
  "김해시",
  "밀양시",
  "거제시",
  "양산시",
  "의령군",
  "함안군",
  "창녕군",
  "고성군",
  "남해군",
  "하동군",
  "산청군",
  "함양군",
  "거창군",
  "합천군",
];

/**
 * 강원도 주요 시/군 목록
 */
export const GANGWON_CITIES = [
  "춘천시",
  "원주시",
  "강릉시",
  "동해시",
  "태백시",
  "속초시",
  "삼척시",
  "홍천군",
  "횡성군",
  "영월군",
  "평창군",
  "정선군",
  "철원군",
  "화천군",
  "양구군",
  "인제군",
  "고성군",
  "양양군",
];

/**
 * 주소 문자열에서 지역을 분류하는 메인 함수
 *
 * @param address 주소 문자열
 * @returns 분류된 지역명 (시/도 단위)
 */
export const getRegionFromAddress = (address: string): string => {
  if (!address) return "기타";

  const addr = address.trim();

  // 1. 특별시/광역시/특별자치시/특별자치도 직접 매칭
  if (addr.includes("서울") || addr.startsWith("서울"))
    return KOREA_REGIONS.SEOUL;
  if (addr.includes("부산") || addr.startsWith("부산"))
    return KOREA_REGIONS.BUSAN;
  if (addr.includes("대구") || addr.startsWith("대구"))
    return KOREA_REGIONS.DAEGU;
  if (addr.includes("인천") || addr.startsWith("인천"))
    return KOREA_REGIONS.INCHEON;
  if (addr.includes("광주") || addr.startsWith("광주"))
    return KOREA_REGIONS.GWANGJU;
  if (addr.includes("대전") || addr.startsWith("대전"))
    return KOREA_REGIONS.DAEJEON;
  if (addr.includes("울산") || addr.startsWith("울산"))
    return KOREA_REGIONS.ULSAN;
  if (addr.includes("세종") || addr.startsWith("세종"))
    return KOREA_REGIONS.SEJONG;
  if (addr.includes("제주") || addr.startsWith("제주"))
    return KOREA_REGIONS.JEJU;

  // 2. 도 단위 직접 매칭
  if (addr.includes("경기") || addr.startsWith("경기"))
    return KOREA_REGIONS.GYEONGGI;
  if (addr.includes("강원") || addr.startsWith("강원"))
    return KOREA_REGIONS.GANGWON;
  if (
    addr.includes("충청북도") ||
    addr.includes("충북") ||
    addr.startsWith("충청북도")
  ) {
    return KOREA_REGIONS.CHUNGBUK;
  }
  if (
    addr.includes("충청남도") ||
    addr.includes("충남") ||
    addr.startsWith("충청남도")
  ) {
    return KOREA_REGIONS.CHUNGNAM;
  }
  if (
    addr.includes("전라북도") ||
    addr.includes("전북") ||
    addr.startsWith("전라북도")
  ) {
    return KOREA_REGIONS.JEONBUK;
  }
  if (
    addr.includes("전라남도") ||
    addr.includes("전남") ||
    addr.startsWith("전라남도")
  ) {
    return KOREA_REGIONS.JEONNAM;
  }
  if (
    addr.includes("경상북도") ||
    addr.includes("경북") ||
    addr.startsWith("경상북도")
  ) {
    return KOREA_REGIONS.GYEONGBUK;
  }
  if (
    addr.includes("경상남도") ||
    addr.includes("경남") ||
    addr.startsWith("경상남도")
  ) {
    return KOREA_REGIONS.GYEONGNAM;
  }

  // 3. 시/군 단위로 도 추정
  const cityMatch = addr.match(/^([가-힣]+[시군])/);
  if (cityMatch) {
    const city = cityMatch[1];

    // 각 도별 시/군 목록에서 검색
    if (GYEONGGI_CITIES.includes(city)) return KOREA_REGIONS.GYEONGGI;
    if (CHUNGBUK_CITIES.includes(city)) return KOREA_REGIONS.CHUNGBUK;
    if (CHUNGNAM_CITIES.includes(city)) return KOREA_REGIONS.CHUNGNAM;
    if (JEONBUK_CITIES.includes(city)) return KOREA_REGIONS.JEONBUK;
    if (JEONNAM_CITIES.includes(city)) return KOREA_REGIONS.JEONNAM;
    if (GYEONGBUK_CITIES.includes(city)) return KOREA_REGIONS.GYEONGBUK;
    if (GYEONGNAM_CITIES.includes(city)) return KOREA_REGIONS.GYEONGNAM;
    if (GANGWON_CITIES.includes(city)) return KOREA_REGIONS.GANGWON;

    // 매칭되지 않는 시/군은 그대로 반환
    return city;
  }

  return "기타";
};

/**
 * 지역별 농장 분포 계산
 *
 * @param farms 농장 배열 (farm_address 필드 포함)
 * @returns 지역별 농장 수 객체
 */
export const calculateRegionDistribution = (
  farms: Array<{ farm_address: string }>
) => {
  const regionCounts: Record<string, number> = {};

  farms.forEach((farm) => {
    const region = getRegionFromAddress(farm.farm_address);
    regionCounts[region] = (regionCounts[region] || 0) + 1;
  });

  return regionCounts;
};

/**
 * 지역별 농장 분포를 퍼센트로 계산
 *
 * @param farms 농장 배열
 * @returns 지역별 농장 수와 퍼센트 배열
 */
export const getRegionDistributionWithPercentage = (
  farms: Array<{ farm_address: string }>
) => {
  const regionCounts = calculateRegionDistribution(farms);
  const totalFarms = farms.length;

  return Object.entries(regionCounts)
    .map(([region, count]) => ({
      region,
      count,
      percentage: totalFarms > 0 ? Math.round((count / totalFarms) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count); // 농장 수 기준 내림차순 정렬
};

/**
 * 특정 지역의 농장 필터링
 *
 * @param farms 농장 배열
 * @param targetRegion 대상 지역
 * @returns 해당 지역의 농장들
 */
export const filterFarmsByRegion = (
  farms: Array<{ farm_address: string }>,
  targetRegion: string
) => {
  return farms.filter(
    (farm) => getRegionFromAddress(farm.farm_address) === targetRegion
  );
};

/**
 * 지역명 유효성 검사
 *
 * @param region 지역명
 * @returns 유효한 지역명인지 여부
 */
export const isValidRegion = (region: string): boolean => {
  const allRegions = Object.values(KOREA_REGIONS) as string[];
  return allRegions.includes(region) || region === "기타";
};
