/**
 * Supabase 관련 에러 코드 및 메시지 정의
 */
export type SupabaseErrorInfo = {
  message: string;
  status: number;
};

export const SUPABASE_ERROR_MAP: Record<string, SupabaseErrorInfo> = {
  // ===========================================
  // Supabase Auth 에러
  // ===========================================
  SUPABASE_ANONYMOUS_PROVIDER_DISABLED: {
    message: "익명 로그인이 비활성화되어 있습니다.",
    status: 400,
  },
  SUPABASE_BAD_CODE_VERIFIER: {
    message: "PKCE 인증 코드 검증에 실패했습니다. 다시 시도해주세요.",
    status: 400,
  },
  SUPABASE_BAD_JSON: {
    message: "잘못된 JSON 형식입니다.",
    status: 400,
  },
  SUPABASE_BAD_JWT: {
    message: "유효하지 않은 인증 토큰입니다.",
    status: 401,
  },
  SUPABASE_BAD_OAUTH_CALLBACK: {
    message: "OAuth 인증 콜백 처리 중 오류가 발생했습니다.",
    status: 400,
  },
  SUPABASE_BAD_OAUTH_STATE: {
    message: "OAuth 상태가 올바르지 않습니다.",
    status: 400,
  },
  SUPABASE_CAPTCHA_FAILED: {
    message: "캡차 인증에 실패했습니다.",
    status: 400,
  },
  SUPABASE_CONFLICT: {
    message: "데이터 충돌이 발생했습니다. 잠시 후 다시 시도해주세요.",
    status: 409,
  },
  SUPABASE_EMAIL_ADDRESS_INVALID: {
    message: "유효하지 않은 이메일 주소입니다.",
    status: 400,
  },
  SUPABASE_EMAIL_ADDRESS_NOT_AUTHORIZED: {
    message: "이 이메일 주소로는 메일을 보낼 수 없습니다.",
    status: 400,
  },
  SUPABASE_EMAIL_CONFLICT_IDENTITY_NOT_DELETABLE: {
    message: "이메일이 연결된 소셜 계정은 삭제할 수 없습니다.",
    status: 400,
  },
  SUPABASE_EMAIL_EXISTS: {
    message: "이미 가입된 이메일입니다.",
    status: 409,
  },
  SUPABASE_EMAIL_NOT_CONFIRMED: {
    message: "이메일 인증이 필요합니다.",
    status: 400,
  },
  SUPABASE_EMAIL_PROVIDER_DISABLED: {
    message: "이메일 회원가입이 비활성화되어 있습니다.",
    status: 400,
  },
  SUPABASE_FLOW_STATE_EXPIRED: {
    message: "인증 세션이 만료되었습니다. 다시 시도해주세요.",
    status: 400,
  },
  SUPABASE_FLOW_STATE_NOT_FOUND: {
    message: "인증 세션을 찾을 수 없습니다. 다시 시도해주세요.",
    status: 400,
  },
  SUPABASE_HOOK_PAYLOAD_INVALID_CONTENT_TYPE: {
    message: "인증 훅의 Content-Type이 올바르지 않습니다.",
    status: 400,
  },
  SUPABASE_HOOK_PAYLOAD_OVER_SIZE_LIMIT: {
    message: "인증 훅 데이터가 너무 큽니다.",
    status: 400,
  },
  SUPABASE_HOOK_TIMEOUT: {
    message: "인증 훅 연결 시간이 초과되었습니다.",
    status: 408,
  },
  SUPABASE_HOOK_TIMEOUT_AFTER_RETRY: {
    message: "인증 훅 재시도 후에도 연결할 수 없습니다.",
    status: 408,
  },
  SUPABASE_IDENTITY_ALREADY_EXISTS: {
    message: "이미 다른 계정에 연동된 소셜 계정입니다.",
    status: 409,
  },
  SUPABASE_IDENTITY_NOT_FOUND: {
    message: "연동할 소셜 계정을 찾을 수 없습니다.",
    status: 404,
  },
  SUPABASE_INSUFFICIENT_AAL: {
    message: "더 높은 인증 수준이 필요합니다.",
    status: 400,
  },
  SUPABASE_INVITE_NOT_FOUND: {
    message: "초대가 만료되었거나 이미 사용되었습니다.",
    status: 404,
  },
  SUPABASE_INVALID_CREDENTIALS: {
    message: "로그인 정보가 올바르지 않습니다.",
    status: 401,
  },
  SUPABASE_MANUAL_LINKING_DISABLED: {
    message: "소셜 계정 연동 기능이 비활성화되어 있습니다.",
    status: 400,
  },
  SUPABASE_NO_AUTHORIZATION: {
    message: "인증이 필요합니다.",
    status: 401,
  },
  SUPABASE_NOT_ADMIN: {
    message: "관리자 권한이 필요합니다.",
    status: 403,
  },
  SUPABASE_OAUTH_PROVIDER_NOT_SUPPORTED: {
    message: "지원하지 않는 OAuth 제공자입니다.",
    status: 400,
  },
  SUPABASE_OTP_DISABLED: {
    message: "OTP 로그인이 비활성화되어 있습니다.",
    status: 400,
  },
  SUPABASE_OTP_EXPIRED: {
    message: "OTP 코드가 만료되었습니다.",
    status: 400,
  },
  SUPABASE_OVER_EMAIL_SEND_RATE_LIMIT: {
    message: "이메일 전송 한도가 초과되었습니다.",
    status: 429,
  },
  SUPABASE_OVER_REQUEST_RATE_LIMIT: {
    message: "요청 한도가 초과되었습니다.",
    status: 429,
  },
  SUPABASE_OVER_SMS_SEND_RATE_LIMIT: {
    message: "SMS 전송 한도가 초과되었습니다.",
    status: 429,
  },
  SUPABASE_PHONE_EXISTS: {
    message: "이미 등록된 전화번호입니다.",
    status: 409,
  },
  SUPABASE_PHONE_NOT_CONFIRMED: {
    message: "전화번호 인증이 필요합니다.",
    status: 400,
  },
  SUPABASE_PHONE_PROVIDER_DISABLED: {
    message: "전화번호 회원가입이 비활성화되어 있습니다.",
    status: 400,
  },
  SUPABASE_PROVIDER_DISABLED: {
    message: "OAuth 제공자가 비활성화되어 있습니다.",
    status: 400,
  },
  SUPABASE_PROVIDER_EMAIL_NEEDS_VERIFICATION: {
    message: "OAuth 제공자의 이메일 인증이 필요합니다.",
    status: 400,
  },
  SUPABASE_REAUTHENTICATION_NEEDED: {
    message: "재인증이 필요합니다.",
    status: 401,
  },
  SUPABASE_REAUTHENTICATION_NOT_VALID: {
    message: "재인증 코드가 올바르지 않습니다.",
    status: 400,
  },
  SUPABASE_REFRESH_TOKEN_NOT_FOUND: {
    message: "새로고침 토큰을 찾을 수 없습니다.",
    status: 404,
  },
  SUPABASE_REFRESH_TOKEN_ALREADY_USED: {
    message: "이미 사용된 새로고침 토큰입니다.",
    status: 400,
  },
  SUPABASE_REQUEST_TIMEOUT: {
    message: "요청 시간이 초과되었습니다.",
    status: 408,
  },
  SUPABASE_SAME_PASSWORD: {
    message: "현재 비밀번호와 동일한 비밀번호는 사용할 수 없습니다.",
    status: 400,
  },
  SUPABASE_SAML_ASSERTION_NO_EMAIL: {
    message: "SAML 응답에서 이메일을 찾을 수 없습니다.",
    status: 400,
  },
  SUPABASE_SAML_ASSERTION_NO_USER_ID: {
    message: "SAML 응답에서 사용자 ID를 찾을 수 없습니다.",
    status: 400,
  },
  SUPABASE_SAML_ENTITY_ID_MISMATCH: {
    message: "SAML 엔티티 ID가 일치하지 않습니다.",
    status: 400,
  },
  SUPABASE_SAML_IDP_ALREADY_EXISTS: {
    message: "SAML ID 제공자가 이미 존재합니다.",
    status: 409,
  },
  SUPABASE_SAML_IDP_NOT_FOUND: {
    message: "SAML ID 제공자를 찾을 수 없습니다.",
    status: 404,
  },
  SUPABASE_SAML_METADATA_FETCH_FAILED: {
    message: "SAML 메타데이터를 가져올 수 없습니다.",
    status: 400,
  },
  SUPABASE_SAML_PROVIDER_DISABLED: {
    message: "SAML 제공자가 비활성화되어 있습니다.",
    status: 400,
  },
  SUPABASE_SAML_RELAY_STATE_EXPIRED: {
    message: "SAML 릴레이 상태가 만료되었습니다.",
    status: 400,
  },
  SUPABASE_SAML_RELAY_STATE_NOT_FOUND: {
    message: "SAML 릴레이 상태를 찾을 수 없습니다.",
    status: 404,
  },
  SUPABASE_SESSION_EXPIRED: {
    message: "세션이 만료되었습니다.",
    status: 401,
  },
  SUPABASE_SESSION_NOT_FOUND: {
    message: "세션을 찾을 수 없습니다.",
    status: 404,
  },
  SUPABASE_SIGNUP_DISABLED: {
    message: "회원가입이 비활성화되어 있습니다.",
    status: 400,
  },
  SUPABASE_SINGLE_IDENTITY_NOT_DELETABLE: {
    message: "마지막 남은 소셜 계정은 삭제할 수 없습니다.",
    status: 400,
  },
  SUPABASE_SMS_SEND_FAILED: {
    message: "SMS 전송에 실패했습니다.",
    status: 500,
  },
  SUPABASE_SSO_DOMAIN_ALREADY_EXISTS: {
    message: "SSO 도메인이 이미 등록되어 있습니다.",
    status: 409,
  },
  SUPABASE_SSO_PROVIDER_NOT_FOUND: {
    message: "SSO 제공자를 찾을 수 없습니다.",
    status: 404,
  },
  SUPABASE_TOO_MANY_ENROLLED_MFA_FACTORS: {
    message: "등록된 MFA 인증 요소가 너무 많습니다.",
    status: 400,
  },
  SUPABASE_UNEXPECTED_AUDIENCE: {
    message: "예상치 못한 JWT 대상입니다.",
    status: 400,
  },
  SUPABASE_UNEXPECTED_FAILURE: {
    message: "예상치 못한 오류가 발생했습니다.",
    status: 500,
  },
  SUPABASE_USER_ALREADY_EXISTS: {
    message: "이미 존재하는 사용자입니다.",
    status: 409,
  },
  SUPABASE_USER_BANNED: {
    message: "차단된 사용자입니다.",
    status: 403,
  },
  SUPABASE_USER_NOT_FOUND: {
    message: "사용자를 찾을 수 없습니다.",
    status: 404,
  },
  SUPABASE_USER_SSO_MANAGED: {
    message: "SSO로 관리되는 사용자입니다.",
    status: 400,
  },
  SUPABASE_VALIDATION_FAILED: {
    message: "입력 정보가 올바르지 않습니다.",
    status: 400,
  },
  SUPABASE_WEAK_PASSWORD: {
    message: "비밀번호가 너무 약합니다.",
    status: 400,
  },

  // ===========================================
  // Supabase Storage 에러
  // ===========================================
  SUPABASE_STORAGE_NO_SUCH_BUCKET: {
    message: "지정된 버킷이 존재하지 않습니다.",
    status: 404,
  },
  SUPABASE_STORAGE_NO_SUCH_KEY: {
    message: "지정된 파일이 존재하지 않습니다.",
    status: 404,
  },
  SUPABASE_STORAGE_NO_SUCH_UPLOAD: {
    message: "지정된 업로드가 존재하지 않습니다.",
    status: 404,
  },
  SUPABASE_STORAGE_INVALID_JWT: {
    message: "유효하지 않은 인증 토큰입니다.",
    status: 401,
  },
  SUPABASE_STORAGE_INVALID_REQUEST: {
    message: "잘못된 요청입니다.",
    status: 400,
  },
  SUPABASE_STORAGE_TENANT_NOT_FOUND: {
    message: "지정된 테넌트가 존재하지 않습니다.",
    status: 404,
  },
  SUPABASE_STORAGE_ENTITY_TOO_LARGE: {
    message: "업로드하려는 파일이 너무 큽니다.",
    status: 413,
  },
  SUPABASE_STORAGE_INTERNAL_ERROR: {
    message: "내부 서버 오류가 발생했습니다.",
    status: 500,
  },
  SUPABASE_STORAGE_RESOURCE_ALREADY_EXISTS: {
    message: "지정된 리소스가 이미 존재합니다.",
    status: 409,
  },
  SUPABASE_STORAGE_INVALID_BUCKET_NAME: {
    message: "유효하지 않은 버킷 이름입니다.",
    status: 400,
  },
  SUPABASE_STORAGE_INVALID_KEY: {
    message: "유효하지 않은 파일 키입니다.",
    status: 400,
  },
  SUPABASE_STORAGE_INVALID_RANGE: {
    message: "유효하지 않은 범위입니다.",
    status: 400,
  },
  SUPABASE_STORAGE_INVALID_MIME_TYPE: {
    message: "유효하지 않은 파일 형식입니다.",
    status: 400,
  },
  SUPABASE_STORAGE_INVALID_UPLOAD_ID: {
    message: "유효하지 않은 업로드 ID입니다.",
    status: 400,
  },
  SUPABASE_STORAGE_KEY_ALREADY_EXISTS: {
    message: "지정된 파일이 이미 존재합니다.",
    status: 409,
  },
  SUPABASE_STORAGE_BUCKET_ALREADY_EXISTS: {
    message: "지정된 버킷이 이미 존재합니다.",
    status: 409,
  },
  SUPABASE_STORAGE_DATABASE_TIMEOUT: {
    message: "데이터베이스 접근 시간이 초과되었습니다.",
    status: 408,
  },
  SUPABASE_STORAGE_INVALID_SIGNATURE: {
    message: "유효하지 않은 서명입니다.",
    status: 401,
  },
  SUPABASE_STORAGE_SIGNATURE_DOES_NOT_MATCH: {
    message: "서명이 일치하지 않습니다.",
    status: 401,
  },
  SUPABASE_STORAGE_ACCESS_DENIED: {
    message: "접근이 거부되었습니다.",
    status: 403,
  },
  SUPABASE_STORAGE_RESOURCE_LOCKED: {
    message: "리소스가 잠겨 있습니다.",
    status: 423,
  },
  SUPABASE_STORAGE_DATABASE_ERROR: {
    message: "데이터베이스 오류가 발생했습니다.",
    status: 500,
  },
  SUPABASE_STORAGE_MISSING_CONTENT_LENGTH: {
    message: "Content-Length 헤더가 누락되었습니다.",
    status: 400,
  },
  SUPABASE_STORAGE_MISSING_PARAMETER: {
    message: "필수 매개변수가 누락되었습니다.",
    status: 400,
  },
  SUPABASE_STORAGE_INVALID_UPLOAD_SIGNATURE: {
    message: "유효하지 않은 업로드 서명입니다.",
    status: 401,
  },
  SUPABASE_STORAGE_LOCK_TIMEOUT: {
    message: "잠금 대기 시간이 초과되었습니다.",
    status: 408,
  },
  SUPABASE_STORAGE_S3_ERROR: {
    message: "스토리지 서비스 오류가 발생했습니다.",
    status: 500,
  },
  SUPABASE_STORAGE_S3_INVALID_ACCESS_KEY_ID: {
    message: "유효하지 않은 액세스 키 ID입니다.",
    status: 401,
  },
  SUPABASE_STORAGE_S3_MAXIMUM_CREDENTIALS_LIMIT: {
    message: "최대 자격 증명 수에 도달했습니다.",
    status: 429,
  },
  SUPABASE_STORAGE_INVALID_CHECKSUM: {
    message: "파일 체크섬이 일치하지 않습니다.",
    status: 400,
  },
  SUPABASE_STORAGE_MISSING_PART: {
    message: "파일 일부가 누락되었습니다.",
    status: 400,
  },
  SUPABASE_STORAGE_SLOW_DOWN: {
    message: "요청 속도가 너무 높습니다.",
    status: 429,
  },

  // ===========================================
  // Supabase Database 에러
  // ===========================================
  SUPABASE_DATABASE_CONNECTION_ERROR: {
    message: "데이터베이스 연결 오류가 발생했습니다.",
    status: 500,
  },
  SUPABASE_DATABASE_CONNECTION_LOST: {
    message: "데이터베이스 연결이 끊어졌습니다.",
    status: 500,
  },
  SUPABASE_DATABASE_CONNECTION_FAILED: {
    message: "데이터베이스 연결에 실패했습니다.",
    status: 500,
  },
  SUPABASE_DATABASE_DOES_NOT_EXIST: {
    message: "지정된 데이터베이스가 존재하지 않습니다.",
    status: 404,
  },
  SUPABASE_DATABASE_DATA_PROCESSING_ERROR: {
    message: "데이터 처리 오류가 발생했습니다.",
    status: 400,
  },
  SUPABASE_DATABASE_TEXT_TOO_LONG: {
    message: "입력된 텍스트가 너무 깁니다.",
    status: 400,
  },
  SUPABASE_DATABASE_MISSING_REQUIRED_VALUE: {
    message: "필수 값이 누락되었습니다.",
    status: 400,
  },
  SUPABASE_DATABASE_NUMBER_OUT_OF_RANGE: {
    message: "입력된 숫자가 범위를 벗어났습니다.",
    status: 400,
  },
  SUPABASE_DATABASE_INVALID_NULL_VALUE: {
    message: "잘못된 null 값 사용입니다.",
    status: 400,
  },
  SUPABASE_DATABASE_INVALID_NUMBER_FORMAT: {
    message: "유효하지 않은 숫자 형식입니다.",
    status: 400,
  },
  SUPABASE_DATABASE_INVALID_DATETIME_FORMAT: {
    message: "유효하지 않은 날짜/시간 형식입니다.",
    status: 400,
  },
  SUPABASE_DATABASE_DATETIME_OUT_OF_RANGE: {
    message: "날짜/시간이 범위를 벗어났습니다.",
    status: 400,
  },
  SUPABASE_DATABASE_DIVISION_BY_ZERO: {
    message: "0으로 나누기를 시도했습니다.",
    status: 400,
  },
  SUPABASE_DATABASE_INVALID_CHARACTER_VALUE: {
    message: "유효하지 않은 문자 값입니다.",
    status: 400,
  },
  SUPABASE_DATABASE_INVALID_ESCAPE_CHARACTER: {
    message: "유효하지 않은 이스케이프 문자입니다.",
    status: 400,
  },
  SUPABASE_DATABASE_INVALID_CHARACTER_SET: {
    message: "유효하지 않은 문자 집합입니다.",
    status: 400,
  },
  SUPABASE_DATABASE_INVALID_PARAMETER_VALUE: {
    message: "유효하지 않은 매개변수 값입니다.",
    status: 400,
  },
  SUPABASE_DATABASE_INVALID_ESCAPE_SEQUENCE: {
    message: "유효하지 않은 이스케이프 시퀀스입니다.",
    status: 400,
  },
  SUPABASE_DATABASE_INVALID_STRING_LENGTH: {
    message: "문자열 데이터 길이가 유효하지 않습니다.",
    status: 400,
  },
  SUPABASE_DATABASE_FLOATING_POINT_EXCEPTION: {
    message: "부동 소수점 예외가 발생했습니다.",
    status: 400,
  },
  SUPABASE_DATABASE_DATA_TYPE_CONVERSION_FAILED: {
    message: "데이터 타입 변환에 실패했습니다.",
    status: 400,
  },
  SUPABASE_DATABASE_INVALID_DATETIME_VALUE: {
    message: "유효하지 않은 날짜/시간 값입니다.",
    status: 400,
  },
  SUPABASE_DATABASE_NULL_VALUE_NOT_ALLOWED: {
    message: "허용되지 않는 null 값 사용입니다.",
    status: 400,
  },
  SUPABASE_DATABASE_INVALID_XML_VALUE: {
    message: "유효하지 않은 XML 값입니다.",
    status: 400,
  },
  SUPABASE_DATABASE_INTEGRITY_CONSTRAINT_VIOLATION: {
    message: "무결성 제약 조건 위반입니다.",
    status: 400,
  },
  SUPABASE_DATABASE_REQUIRED_FIELD_EMPTY: {
    message: "필수 필드가 비어 있습니다.",
    status: 400,
  },
  SUPABASE_DATABASE_REFERENCED_RECORD_NOT_FOUND: {
    message: "참조하는 레코드가 존재하지 않습니다.",
    status: 400,
  },
  SUPABASE_DATABASE_RECORD_ALREADY_EXISTS: {
    message: "이미 존재하는 레코드입니다.",
    status: 409,
  },
  SUPABASE_DATABASE_DATA_CONDITION_NOT_MET: {
    message: "데이터가 조건을 만족하지 않습니다.",
    status: 400,
  },
  SUPABASE_DATABASE_INVALID_TRANSACTION_STATE: {
    message: "트랜잭션 상태가 유효하지 않습니다.",
    status: 400,
  },
  SUPABASE_DATABASE_TRANSACTION_ABORTED: {
    message: "트랜잭션이 중단되었습니다.",
    status: 400,
  },
  SUPABASE_DATABASE_AUTHENTICATION_FAILED: {
    message: "인증에 실패했습니다.",
    status: 401,
  },
  SUPABASE_DATABASE_INVALID_PASSWORD: {
    message: "잘못된 비밀번호입니다.",
    status: 401,
  },
  SUPABASE_DATABASE_SCHEMA_DOES_NOT_EXIST: {
    message: "지정된 스키마가 존재하지 않습니다.",
    status: 404,
  },
  SUPABASE_DATABASE_SERIALIZATION_FAILURE: {
    message: "동시 업데이트로 인한 직렬화 실패입니다.",
    status: 400,
  },
  SUPABASE_DATABASE_DEADLOCK_DETECTED: {
    message: "교착 상태가 감지되었습니다.",
    status: 400,
  },
  SUPABASE_DATABASE_SYNTAX_ERROR_OR_PERMISSION_VIOLATION: {
    message: "구문 오류 또는 권한 위반입니다.",
    status: 400,
  },
  SUPABASE_DATABASE_INSUFFICIENT_PRIVILEGE: {
    message: "이 작업을 수행할 권한이 없습니다.",
    status: 403,
  },
  SUPABASE_DATABASE_SQL_SYNTAX_ERROR: {
    message: "SQL 구문 오류입니다.",
    status: 400,
  },
  SUPABASE_DATABASE_INVALID_IDENTIFIER: {
    message: "유효하지 않은 식별자입니다.",
    status: 400,
  },
  SUPABASE_DATABASE_DUPLICATE_COLUMN_NAME: {
    message: "중복된 열 이름입니다.",
    status: 400,
  },
  SUPABASE_DATABASE_AMBIGUOUS_COLUMN_REFERENCE: {
    message: "모호한 열 참조입니다.",
    status: 400,
  },
  SUPABASE_DATABASE_UNDEFINED_COLUMN: {
    message: "존재하지 않는 열입니다.",
    status: 400,
  },
  SUPABASE_DATABASE_UNDEFINED_DATABASE_OBJECT: {
    message: "존재하지 않는 데이터베이스 객체입니다.",
    status: 404,
  },
  SUPABASE_DATABASE_OBJECT_ALREADY_EXISTS: {
    message: "이미 존재하는 객체입니다.",
    status: 409,
  },
  SUPABASE_DATABASE_AMBIGUOUS_ALIAS: {
    message: "모호한 별칭입니다.",
    status: 400,
  },
  SUPABASE_DATABASE_GROUPING_ERROR: {
    message: "그룹화 오류입니다.",
    status: 400,
  },
  SUPABASE_DATABASE_DATA_TYPE_MISMATCH: {
    message: "데이터 타입 불일치입니다.",
    status: 400,
  },
  SUPABASE_DATABASE_INVALID_FOREIGN_KEY_DEFINITION: {
    message: "유효하지 않은 외래 키 정의입니다.",
    status: 400,
  },
  SUPABASE_DATABASE_UNDEFINED_FUNCTION_OR_OPERATOR: {
    message: "존재하지 않는 함수 또는 연산자입니다.",
    status: 400,
  },
  SUPABASE_DATABASE_UNDEFINED_TABLE: {
    message: "존재하지 않는 테이블입니다.",
    status: 404,
  },
  SUPABASE_DATABASE_UNDEFINED_PARAMETER: {
    message: "정의되지 않은 매개변수입니다.",
    status: 400,
  },
  SUPABASE_DATABASE_TABLE_ALREADY_EXISTS: {
    message: "이미 존재하는 테이블입니다.",
    status: 409,
  },
  SUPABASE_DATABASE_INDETERMINATE_DATA_TYPE_ERROR: {
    message: "불확정 데이터 타입 사용 오류입니다.",
    status: 400,
  },
  SUPABASE_DATABASE_INSUFFICIENT_RESOURCES: {
    message: "데이터베이스 리소스 부족입니다.",
    status: 500,
  },
  SUPABASE_DATABASE_DISK_SPACE_EXHAUSTED: {
    message: "디스크 공간 부족입니다.",
    status: 500,
  },
  SUPABASE_DATABASE_MEMORY_EXHAUSTED: {
    message: "메모리 부족입니다.",
    status: 500,
  },
  SUPABASE_DATABASE_MAX_CONNECTIONS_REACHED: {
    message: "최대 연결 수에 도달했습니다.",
    status: 429,
  },
  SUPABASE_DATABASE_PROGRAM_LIMIT_EXCEEDED: {
    message: "프로그램 제한 초과입니다.",
    status: 400,
  },
  SUPABASE_DATABASE_STATEMENT_TOO_COMPLEX: {
    message: "문장이 너무 복잡합니다.",
    status: 400,
  },
  SUPABASE_DATABASE_TOO_MANY_COLUMNS: {
    message: "너무 많은 열이 지정되었습니다.",
    status: 400,
  },
  SUPABASE_DATABASE_TOO_MUCH_MEMORY_REQUESTED: {
    message: "너무 많은 메모리가 요청되었습니다.",
    status: 400,
  },
  SUPABASE_DATABASE_INVALID_OBJECT_STATE: {
    message: "객체 상태가 올바르지 않습니다.",
    status: 400,
  },
  SUPABASE_DATABASE_OBJECT_IN_USE: {
    message: "객체가 다른 프로세스에서 사용 중입니다.",
    status: 409,
  },
  SUPABASE_DATABASE_LOCK_NOT_AVAILABLE: {
    message: "잠금을 획득할 수 없습니다.",
    status: 409,
  },
  SUPABASE_DATABASE_QUERY_CANCELLED: {
    message: "쿼리가 취소되었습니다.",
    status: 400,
  },
  SUPABASE_DATABASE_FILE_ACCESS_ERROR: {
    message: "필요한 파일에 접근할 수 없습니다.",
    status: 500,
  },
  SUPABASE_DATABASE_CUSTOM_ERROR: {
    message: "사용자 정의 오류가 발생했습니다.",
    status: 500,
  },
  SUPABASE_DATABASE_NO_DATA_FOUND: {
    message: "예상된 결과를 찾을 수 없습니다.",
    status: 404,
  },
  SUPABASE_DATABASE_TOO_MANY_ROWS: {
    message: "너무 많은 결과가 반환되었습니다.",
    status: 400,
  },
  SUPABASE_DATABASE_ASSERTION_FAILURE: {
    message: "어설션 실패입니다.",
    status: 400,
  },
  SUPABASE_DATABASE_CONNECTION_UNAVAILABLE: {
    message: "데이터베이스에 연결할 수 없습니다.",
    status: 500,
  },
  SUPABASE_DATABASE_INVALID_DATABASE_ROLE: {
    message: "유효하지 않은 데이터베이스 역할입니다.",
    status: 400,
  },
  SUPABASE_DATABASE_SCHEMA_ACCESS_DENIED: {
    message: "스키마에 접근할 수 없습니다.",
    status: 403,
  },
  SUPABASE_DATABASE_SCHEMA_CACHE_LOAD_FAILED: {
    message: "스키마 캐시를 로드할 수 없습니다.",
    status: 500,
  },
  SUPABASE_DATABASE_JWT_TOKEN_INVALID_OR_EXPIRED: {
    message: "JWT 토큰이 유효하지 않거나 만료되었습니다.",
    status: 401,
  },
  SUPABASE_DATABASE_JWT_SECRET_MISSING_OR_INVALID: {
    message: "JWT 시크릿이 누락되었거나 올바르지 않습니다.",
    status: 500,
  },
  SUPABASE_DATABASE_JWT_ROLE_CLAIM_INVALID: {
    message: "JWT 역할 클레임이 유효하지 않습니다.",
    status: 400,
  },
  SUPABASE_DATABASE_JWT_DATABASE_ROLE_NOT_FOUND: {
    message: "JWT에 지정된 데이터베이스 역할이 존재하지 않습니다.",
    status: 404,
  },
  SUPABASE_DATABASE_SERVER_CONFIGURATION_INVALID: {
    message: "서버 구성이 유효하지 않습니다.",
    status: 500,
  },
  SUPABASE_DATABASE_UNSUPPORTED_MEDIA_TYPE: {
    message: "지원되지 않는 미디어 타입입니다.",
    status: 415,
  },
  SUPABASE_DATABASE_SCHEMA_NOT_EXPOSED: {
    message: "요청된 스키마가 노출되지 않습니다.",
    status: 403,
  },
  SUPABASE_DATABASE_TABLE_OR_VIEW_NOT_EXPOSED: {
    message: "요청된 테이블/뷰가 노출되지 않습니다.",
    status: 403,
  },
  SUPABASE_DATABASE_FUNCTION_NOT_EXPOSED_OR_NOT_FOUND: {
    message: "요청된 함수가 노출되지 않거나 존재하지 않습니다.",
    status: 404,
  },
  SUPABASE_DATABASE_VOLATILE_FUNCTION_CALL_NOT_ALLOWED: {
    message: "GET 요청으로 휘발성 함수를 호출할 수 없습니다.",
    status: 400,
  },
  SUPABASE_DATABASE_REQUEST_BODY_INVALID: {
    message: "요청 본문이 잘못되었습니다.",
    status: 400,
  },
  SUPABASE_DATABASE_INVALID_QUERY_PARAMETER: {
    message: "유효하지 않은 쿼리 매개변수입니다.",
    status: 400,
  },
  SUPABASE_DATABASE_INVALID_HTTP_HEADER: {
    message: "유효하지 않은 HTTP 헤더입니다.",
    status: 400,
  },
  SUPABASE_DATABASE_SECURITY_POLICY_VIOLATION: {
    message: "보안 정책을 위반했습니다.",
    status: 403,
  },
  SUPABASE_DATABASE_REQUESTED_RESOURCE_NOT_FOUND: {
    message: "요청된 리소스를 찾을 수 없습니다.",
    status: 404,
  },
  SUPABASE_DATABASE_BULK_INSERT_OR_UPDATE_ERROR: {
    message: "대량 삽입 또는 업데이트 중 오류가 발생했습니다.",
    status: 500,
  },
  SUPABASE_DATABASE_OPERATION_NOT_ALLOWED: {
    message: "요청된 작업이 허용되지 않습니다.",
    status: 403,
  },
  SUPABASE_DATABASE_AFFECTED_ROW_COUNT_MISMATCH: {
    message: "영향받은 행 수가 예상과 일치하지 않습니다.",
    status: 400,
  },
  SUPABASE_DATABASE_REQUESTED_RANGE_NOT_SATISFIABLE: {
    message: "요청된 범위를 충족할 수 없습니다.",
    status: 416,
  },
  SUPABASE_DATABASE_INVALID_FILTER_OR_ORDER_PARAMETER: {
    message: "유효하지 않은 필터 또는 정렬 매개변수입니다.",
    status: 400,
  },
  SUPABASE_DATABASE_COLUMN_NOT_FOUND: {
    message: "지정된 열을 찾을 수 없습니다.",
    status: 404,
  },
};
