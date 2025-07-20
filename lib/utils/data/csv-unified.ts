/**
 * 통합 CSV 내보내기 유틸리티
 *
 *
 *
 */

import Papa from "papaparse";
import { getKSTDateTimeForFileName, formatDateTime } from "../datetime/date";
import { devLog } from "../logging/dev-logger";
import type { VisitorWithFarm } from "@/lib/types/visitor";
import type { VisitorsExportOptions } from "@/components/admin/management/exports/types";

// ============================================
// 핵심 다운로드 함수 (고급 방식만 유지)
// ============================================

export const downloadAdvancedCSV = (
  data: Record<string, any>[],
  options: {
    filename?: string;
    includeBOM?: boolean;
    includeDate?: boolean;
  } = {}
): void => {
  const { filename = "data", includeBOM = true, includeDate = true } = options;

  try {
    const csvContent = Papa.unparse(data, {
      header: true,
    });

    downloadCSVContent(csvContent, filename, { includeBOM, includeDate });

    devLog.log(`고급 CSV 다운로드 완료: ${filename} (${data.length}건의 기록)`);
  } catch (error) {
    devLog.error("고급 CSV 다운로드 오류:", error);
    throw new Error("CSV 다운로드 중 오류가 발생했습니다.");
  }
};

/**
 * CSV 콘텐츠를 파일로 다운로드하는 공통 함수
 */
const downloadCSVContent = (
  csvContent: string,
  filename: string,
  options: { includeBOM: boolean; includeDate: boolean }
): void => {
  const { includeBOM, includeDate } = options;

  // UTF-8 BOM 추가 (한글 깨짐 방지)
  const BOM = includeBOM ? "\uFEFF" : "";
  const csvWithBOM = BOM + csvContent;

  // Blob 생성
  const blob = new Blob([csvWithBOM], {
    type: "text/csv;charset=utf-8;",
  });

  // 확장자 제거 후 파일명 생성
  const baseFilename = filename.replace(/\.csv$/i, "");
  const finalFilename = includeDate
    ? `${getKSTDateTimeForFileName()}_${baseFilename}.csv`
    : `${baseFilename}.csv`;

  // 다운로드 실행
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", finalFilename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// ============================================
// 방문자 데이터 내보내기
// ============================================

export const exportVisitorsCSV = (
  visitors: Array<
    | VisitorWithFarm
    | {
        farms?: { farm_name?: string; farm_type?: string };
        visit_datetime?: string;
        visitor_name?: string;
        visitor_phone?: string;
        visitor_address?: string;
        vehicle_number?: string;
        visitor_purpose?: string;
        disinfection_check?: boolean;
        consent_given?: boolean;
        notes?: string;
        registered_by?: string;
      }
  >,
  options: VisitorsExportOptions
): void => {
  const {
    includeBasic,
    includeContact,
    includeVisit,
    includeExtra,
    includeFarm = false,
    ...csvOptions
  } = options;

  // Papa Parse 방식 (고급)
  const csvData = visitors.map((visitor) => {
    const row: Record<string, any> = {};

    if (includeBasic) {
      row["방문자 이름"] = visitor.visitor_name || "";
      row["방문 일시"] = visitor.visit_datetime
        ? formatDateTime(visitor.visit_datetime)
        : "";
    }

    if (includeContact) {
      row["연락처"] = visitor.visitor_phone || "";
      row["주소"] = visitor.visitor_address || "";
    }

    if (includeVisit) {
      row["방문 목적"] = visitor.visitor_purpose || "";
      row["방역 완료"] = visitor.disinfection_check ? "예" : "아니오";
      if ("consent_given" in visitor) {
        row["개인정보 동의"] = visitor.consent_given ? "예" : "아니오";
      }
    }

    if (includeExtra) {
      row["차량번호"] = visitor.vehicle_number || "";
      row["메모"] = visitor.notes || "";
      if ("registered_by" in visitor) {
        row["등록자"] = visitor.registered_by || "";
      }
    }

    if (includeFarm && visitor.farms) {
      row["농장명"] = visitor.farms.farm_name || "알 수 없음";
      row["농장 유형"] = visitor.farms.farm_type || "알 수 없음";
    }

    return row;
  });

  downloadAdvancedCSV(csvData, {
    filename: "방문자기록",
    ...csvOptions,
  });
};
