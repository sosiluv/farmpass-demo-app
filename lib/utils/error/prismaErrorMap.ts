/**
 * Prisma 관련 에러 코드 및 메시지 정의
 */
export type PrismaErrorInfo = {
  message: string;
  status: number;
};

export const PRISMA_ERROR_MAP: Record<string, PrismaErrorInfo> = {
  // ===========================================
  // Prisma Client 에러
  // ===========================================
  PRISMA_UNIQUE_CONSTRAINT: {
    message: "이미 등록된 데이터입니다.",
    status: 409,
  },
  PRISMA_NOT_FOUND: {
    message: "요청한 정보를 찾을 수 없습니다.",
    status: 404,
  },
  PRISMA_FOREIGN_KEY_CONSTRAINT: {
    message: "관련된 데이터가 존재하지 않습니다.",
    status: 400,
  },
  PRISMA_RECORD_NOT_FOUND: {
    message: "요청한 레코드를 찾을 수 없습니다.",
    status: 404,
  },
  PRISMA_CONSTRAINT_FAILED: {
    message: "데이터 제약 조건을 만족하지 않습니다.",
    status: 400,
  },
  PRISMA_VALUE_TOO_LONG: {
    message: "입력된 값이 너무 깁니다.",
    status: 400,
  },
  PRISMA_INVALID_FIELD_VALUE: {
    message: "필드 값이 유효하지 않습니다.",
    status: 400,
  },
  PRISMA_RELATED_RECORD_NOT_FOUND: {
    message: "관련된 레코드를 찾을 수 없습니다.",
    status: 404,
  },
  PRISMA_INTERPRETED_DATA_VALIDATION_ERROR: {
    message: "데이터 검증에 실패했습니다.",
    status: 400,
  },
  PRISMA_QUERY_INTERPRETATION_ERROR: {
    message: "쿼리 해석 중 오류가 발생했습니다.",
    status: 400,
  },
  PRISMA_QUERY_VALIDATION_ERROR: {
    message: "쿼리 검증에 실패했습니다.",
    status: 400,
  },
  PRISMA_VALIDATION_ERROR: {
    message: "데이터 검증에 실패했습니다.",
    status: 400,
  },
  PRISMA_QUERY_ENGINE_RAW_QUERY_FAILED: {
    message: "원시 쿼리 실행에 실패했습니다.",
    status: 500,
  },
  PRISMA_QUERY_ENGINE_STARTUP_ERROR: {
    message: "쿼리 엔진 시작 중 오류가 발생했습니다.",
    status: 500,
  },
  PRISMA_QUERY_ENGINE_EXIT_ERROR: {
    message: "쿼리 엔진 종료 중 오류가 발생했습니다.",
    status: 500,
  },
  PRISMA_QUERY_ENGINE_PANIC_ERROR: {
    message: "쿼리 엔진에서 심각한 오류가 발생했습니다.",
    status: 500,
  },
  PRISMA_MISSING_REQUIRED_VALUE: {
    message: "필수 값이 누락되었습니다.",
    status: 400,
  },
  PRISMA_MISSING_REQUIRED_ARGUMENT: {
    message: "필수 인수가 누락되었습니다.",
    status: 400,
  },
  PRISMA_RELATION_VIOLATION: {
    message: "관계 제약 조건을 위반했습니다.",
    status: 400,
  },
  PRISMA_RELATION_CONNECTIONS_NOT_CREATED: {
    message: "관계 연결을 생성할 수 없습니다.",
    status: 400,
  },
  PRISMA_INPUT_ERROR: {
    message: "입력 데이터에 오류가 있습니다.",
    status: 400,
  },
  PRISMA_VALUE_OUT_OF_RANGE: {
    message: "값이 허용 범위를 벗어났습니다.",
    status: 400,
  },
  PRISMA_TABLE_DOES_NOT_EXIST: {
    message: "테이블이 존재하지 않습니다.",
    status: 404,
  },
  PRISMA_COLUMN_DOES_NOT_EXIST: {
    message: "컬럼이 존재하지 않습니다.",
    status: 404,
  },
  PRISMA_COLUMN_DATA_TYPE_MISMATCH: {
    message: "컬럼 데이터 타입이 일치하지 않습니다.",
    status: 400,
  },
  PRISMA_CONNECTION_POOL_TIMEOUT: {
    message: "연결 풀 시간 초과가 발생했습니다.",
    status: 408,
  },
  PRISMA_CURRENT_DATABASE_PROVIDER_NOT_SUPPORTED: {
    message: "현재 데이터베이스 제공자가 지원되지 않습니다.",
    status: 400,
  },
  PRISMA_FULLTEXT_INDEX_NOT_FOUND: {
    message: "전체 텍스트 인덱스를 찾을 수 없습니다.",
    status: 404,
  },
  PRISMA_MONGODB_REPLICA_SET_REQUIRED: {
    message: "MongoDB 복제 세트가 필요합니다.",
    status: 400,
  },
  PRISMA_NUMBER_OUT_OF_RANGE: {
    message: "숫자가 허용 범위를 벗어났습니다.",
    status: 400,
  },
  PRISMA_TRANSACTION_FAILED: {
    message: "트랜잭션이 실패했습니다.",
    status: 500,
  },
  PRISMA_ASSERTION_VIOLATION: {
    message: "어설션 위반이 발생했습니다.",
    status: 400,
  },
  PRISMA_EXTERNAL_CONNECTOR_ERROR: {
    message: "외부 커넥터 오류가 발생했습니다.",
    status: 500,
  },
  PRISMA_TOO_MANY_CONNECTIONS: {
    message: "데이터베이스 연결이 너무 많습니다.",
    status: 429,
  },

  // ===========================================
  // Prisma 공통 에러
  // ===========================================
  PRISMA_AUTHENTICATION_FAILED: {
    message: "데이터베이스 서버 인증에 실패했습니다.",
    status: 401,
  },
  PRISMA_CANNOT_REACH_DATABASE: {
    message: "데이터베이스 서버에 연결할 수 없습니다.",
    status: 500,
  },
  PRISMA_DATABASE_TIMEOUT: {
    message: "데이터베이스 서버 연결이 타임아웃되었습니다.",
    status: 408,
  },
  PRISMA_DATABASE_DOES_NOT_EXIST: {
    message: "지정된 데이터베이스가 존재하지 않습니다.",
    status: 404,
  },
  PRISMA_OPERATIONS_TIMEOUT: {
    message: "작업이 타임아웃되었습니다.",
    status: 408,
  },
  PRISMA_DATABASE_ALREADY_EXISTS: {
    message: "지정된 데이터베이스가 이미 존재합니다.",
    status: 409,
  },
  PRISMA_USER_ACCESS_DENIED: {
    message: "사용자가 데이터베이스에 대한 접근이 거부되었습니다.",
    status: 403,
  },
  PRISMA_TLS_CONNECTION_ERROR: {
    message: "TLS 연결을 여는 중 오류가 발생했습니다.",
    status: 500,
  },
  PRISMA_SCHEMA_ERROR: {
    message: "스키마에 오류가 있습니다.",
    status: 400,
  },
};
