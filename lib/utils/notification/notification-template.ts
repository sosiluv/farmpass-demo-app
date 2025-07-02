import { formatDateTime, toKSTDateString } from "../datetime/date";

export interface VisitTemplateData {
  방문자명: string;
  농장명: string;
  방문날짜: string;
  방문시간: string;
  방문목적?: string;
  연락처?: string;
  차량번호?: string;
  방역상태?: string;
  등록시간?: string;
}

/**
 * 방문 알림 템플릿을 실제 데이터로 치환하는 함수
 * @param template 시스템 설정의 visitTemplate
 * @param data 방문자 데이터
 * @returns 처리된 메시지
 */
export function processVisitTemplate(
  template: string,
  data: VisitTemplateData
): string {
  if (!template || !template.trim()) {
    // 템플릿이 없으면 기본 메시지 반환
    return `${data.농장명}에 ${data.방문자명}님이 방문하셨습니다.`;
  }

  return template
    .replace(/\{방문자명\}/g, data.방문자명 || "방문자")
    .replace(/\{농장명\}/g, data.농장명 || "농장")
    .replace(/\{방문날짜\}/g, data.방문날짜 || "")
    .replace(/\{방문시간\}/g, data.방문시간 || "")
    .replace(/\{방문목적\}/g, data.방문목적 || "방문")
    .replace(/\{연락처\}/g, data.연락처 || "미제공")
    .replace(/\{차량번호\}/g, data.차량번호 || "없음")
    .replace(/\{방역상태\}/g, data.방역상태 || "미확인")
    .replace(/\{등록시간\}/g, data.등록시간 || "");
}

/**
 * 방문자 데이터로부터 템플릿 데이터 생성
 * @param visitorData 방문자 정보
 * @param farmName 농장명
 * @param visitDateTime 방문 일시
 * @returns VisitTemplateData
 */
export function createVisitTemplateData(
  visitorData: {
    visitor_name: string;
    visitor_phone?: string;
    visitor_purpose?: string;
    vehicle_number?: string;
    disinfection_check?: boolean;
  },
  farmName: string,
  visitDateTime: Date = new Date()
): VisitTemplateData {
  const kstDateTime = new Date(visitDateTime);

  return {
    방문자명: visitorData.visitor_name,
    농장명: farmName,
    방문날짜: formatDateTime(kstDateTime, {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }),
    방문시간: formatDateTime(kstDateTime, {
      hour: "2-digit",
      minute: "2-digit",
    }),
    방문목적: visitorData.visitor_purpose || undefined,
    연락처: visitorData.visitor_phone || undefined,
    차량번호: visitorData.vehicle_number || undefined,
    방역상태: visitorData.disinfection_check ? "완료" : "미완료",
    등록시간: formatDateTime(new Date(), {
      hour: "2-digit",
      minute: "2-digit",
    }),
  };
}

/**
 * 템플릿 유효성 검사 - 지원되는 변수만 사용했는지 확인
 * @param template 검사할 템플릿
 * @returns 유효성 검사 결과
 */
export function validateVisitTemplate(template: string): {
  isValid: boolean;
  unsupportedVariables: string[];
  supportedVariables: string[];
} {
  const supportedVariables = [
    "{방문자명}",
    "{농장명}",
    "{방문날짜}",
    "{방문시간}",
    "{방문목적}",
    "{연락처}",
    "{차량번호}",
    "{방역상태}",
    "{등록시간}",
  ];

  // 템플릿에서 변수 추출 (중괄호로 둘러싸인 것들)
  const variableRegex = /\{[^}]+\}/g;
  const foundVariables = template.match(variableRegex) || [];

  // 중복 제거
  const uniqueFoundVariables = Array.from(new Set(foundVariables));

  // 지원되지 않는 변수 찾기
  const unsupportedVariables = uniqueFoundVariables.filter(
    (variable) => !supportedVariables.includes(variable)
  );

  return {
    isValid: unsupportedVariables.length === 0,
    unsupportedVariables,
    supportedVariables,
  };
}

/**
 * 템플릿 미리보기 생성 (샘플 데이터로)
 * @param template 미리보기할 템플릿
 * @returns 샘플 데이터로 처리된 메시지
 */
export function previewVisitTemplate(template: string): string {
  const sampleData: VisitTemplateData = {
    방문자명: "홍길동",
    농장명: "예시농장",
    방문날짜: "2025.06.27",
    방문시간: "14:30",
    방문목적: "배송",
    연락처: "010-0000-0000",
    차량번호: "12가1234",
    방역상태: "완료",
    등록시간: "14:32",
  };

  return processVisitTemplate(template, sampleData);
}
