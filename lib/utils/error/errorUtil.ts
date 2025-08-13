import { COMBINED_ERROR_MAP, ErrorCode, ErrorInfo } from "./index";

/** 에러 타입 분류 */
export type ErrorType = "auth" | "storage" | "realtime" | "db" | "prisma";

/**
 * 에러 객체 → 표준 코드 자동 변환
 *
 * 다양한 에러 타입을 표준화된 에러 코드로 변환합니다.
 *
 * @param error - 변환할 에러 객체
 * @param type - 에러 타입 (선택사항, 지정하면 해당 타입만 처리)
 * @returns 표준화된 에러 코드
 *
 * @example
 * ```typescript
 * // Prisma 에러 변환
 * const prismaError = new Error("Unique constraint failed");
 * prismaError.code = "P2002";
 * const code = mapRawErrorToCode(prismaError, "prisma");

 *
 * // Supabase Auth 에러 변환
 * const authError = { code: "invalid_credentials" };
 * const code = mapRawErrorToCode(authError, "auth");
 *
 * // 자동 타입 감지
 * const code = mapRawErrorToCode(error); // 모든 타입을 순차적으로 확인
 *
 * // 비즈니스 로직 에러
 * const businessError = { businessCode: "CUSTOM_ERROR" };
 * const code = mapRawErrorToCode(businessError);
 * ```
 */
export function mapRawErrorToCode(error: any, type?: ErrorType): ErrorCode {
  // 비즈니스 로직 커스텀 에러 (가장 우선순위)
  if (error?.businessCode) return error.businessCode as ErrorCode;

  // 타입이 지정된 경우 해당 타입만 처리
  if (type) {
    switch (type) {
      case "prisma":
        return mapPrismaError(error);
      case "auth":
        return mapSupabaseAuthError(error);
      case "storage":
        return mapSupabaseStorageError(error);
      case "db":
        return mapSupabaseDatabaseError(error);
      default:
        return "UNKNOWN_ERROR";
    }
  }

  // 타입이 지정되지 않은 경우 모든 에러 타입을 순차적으로 확인
  const prismaError = mapPrismaError(error);
  if (prismaError !== "UNKNOWN_ERROR") return prismaError;

  const authError = mapSupabaseAuthError(error);
  if (authError !== "UNKNOWN_ERROR") return authError;

  const storageError = mapSupabaseStorageError(error);
  if (storageError !== "UNKNOWN_ERROR") return storageError;

  const dbError = mapSupabaseDatabaseError(error);
  if (dbError !== "UNKNOWN_ERROR") return dbError;

  // fallback
  return "UNKNOWN_ERROR";
}

/** Prisma 에러 매핑 */
function mapPrismaError(error: any): ErrorCode {
  // Prisma Client 에러
  if (error?.code === "P2002") return "PRISMA_UNIQUE_CONSTRAINT";
  if (error?.code === "P2003") return "PRISMA_FOREIGN_KEY_CONSTRAINT";
  if (error?.code === "P2004") return "PRISMA_CONSTRAINT_FAILED";
  if (error?.code === "P2005") return "PRISMA_INVALID_FIELD_VALUE";
  if (error?.code === "P2006") return "PRISMA_INVALID_FIELD_VALUE";
  if (error?.code === "P2007") return "PRISMA_VALIDATION_ERROR";
  if (error?.code === "P2008") return "PRISMA_QUERY_INTERPRETATION_ERROR";
  if (error?.code === "P2009") return "PRISMA_QUERY_VALIDATION_ERROR";
  if (error?.code === "P2010") return "PRISMA_QUERY_ENGINE_RAW_QUERY_FAILED";
  if (error?.code === "P2011") return "PRISMA_CONSTRAINT_FAILED";
  if (error?.code === "P2012") return "PRISMA_MISSING_REQUIRED_VALUE";
  if (error?.code === "P2013") return "PRISMA_MISSING_REQUIRED_ARGUMENT";
  if (error?.code === "P2014") return "PRISMA_RELATION_VIOLATION";
  if (error?.code === "P2015") return "PRISMA_RELATED_RECORD_NOT_FOUND";
  if (error?.code === "P2016")
    return "PRISMA_INTERPRETED_DATA_VALIDATION_ERROR";
  if (error?.code === "P2017") return "PRISMA_RELATION_CONNECTIONS_NOT_CREATED";
  if (error?.code === "P2018") return "PRISMA_RECORD_NOT_FOUND";
  if (error?.code === "P2019") return "PRISMA_INPUT_ERROR";
  if (error?.code === "P2020") return "PRISMA_VALUE_OUT_OF_RANGE";
  if (error?.code === "P2021") return "PRISMA_TABLE_DOES_NOT_EXIST";
  if (error?.code === "P2022") return "PRISMA_COLUMN_DOES_NOT_EXIST";
  if (error?.code === "P2023") return "PRISMA_COLUMN_DATA_TYPE_MISMATCH";
  if (error?.code === "P2024") return "PRISMA_CONNECTION_POOL_TIMEOUT";
  if (error?.code === "P2025") return "PRISMA_NOT_FOUND";
  if (error?.code === "P2026")
    return "PRISMA_CURRENT_DATABASE_PROVIDER_NOT_SUPPORTED";
  if (error?.code === "P2027") return "PRISMA_QUERY_ENGINE_STARTUP_ERROR";
  if (error?.code === "P2028") return "PRISMA_QUERY_ENGINE_EXIT_ERROR";
  if (error?.code === "P2029") return "PRISMA_QUERY_ENGINE_PANIC_ERROR";
  if (error?.code === "P2030") return "PRISMA_FULLTEXT_INDEX_NOT_FOUND";
  if (error?.code === "P2031") return "PRISMA_MONGODB_REPLICA_SET_REQUIRED";
  if (error?.code === "P2033") return "PRISMA_NUMBER_OUT_OF_RANGE";
  if (error?.code === "P2034") return "PRISMA_TRANSACTION_FAILED";
  if (error?.code === "P2035") return "PRISMA_ASSERTION_VIOLATION";
  if (error?.code === "P2036") return "PRISMA_EXTERNAL_CONNECTOR_ERROR";
  if (error?.code === "P2037") return "PRISMA_TOO_MANY_CONNECTIONS";
  if (error?.code === "P2000") return "PRISMA_VALUE_TOO_LONG";
  if (error?.code === "P2001") return "PRISMA_NOT_FOUND";

  // Prisma 공통 에러
  if (error?.code === "P1000") return "PRISMA_AUTHENTICATION_FAILED";
  if (error?.code === "P1001") return "PRISMA_CANNOT_REACH_DATABASE";
  if (error?.code === "P1002") return "PRISMA_DATABASE_TIMEOUT";
  if (error?.code === "P1003") return "PRISMA_DATABASE_DOES_NOT_EXIST";
  if (error?.code === "P1008") return "PRISMA_OPERATIONS_TIMEOUT";
  if (error?.code === "P1009") return "PRISMA_DATABASE_ALREADY_EXISTS";
  if (error?.code === "P1010") return "PRISMA_USER_ACCESS_DENIED";
  if (error?.code === "P1011") return "PRISMA_TLS_CONNECTION_ERROR";
  if (error?.code === "P1012") return "PRISMA_SCHEMA_ERROR";

  return "UNKNOWN_ERROR";
}

/** Supabase Auth 에러 매핑 */
function mapSupabaseAuthError(error: any): ErrorCode {
  if (error?.code === "anonymous_provider_disabled")
    return "SUPABASE_ANONYMOUS_PROVIDER_DISABLED";
  if (error?.code === "bad_code_verifier") return "SUPABASE_BAD_CODE_VERIFIER";
  if (error?.code === "bad_json") return "SUPABASE_BAD_JSON";
  if (error?.code === "bad_jwt") return "SUPABASE_BAD_JWT";
  if (error?.code === "bad_oauth_callback")
    return "SUPABASE_BAD_OAUTH_CALLBACK";
  if (error?.code === "bad_oauth_state") return "SUPABASE_BAD_OAUTH_STATE";
  if (error?.code === "captcha_failed") return "SUPABASE_CAPTCHA_FAILED";
  if (error?.code === "conflict") return "SUPABASE_CONFLICT";
  if (error?.code === "email_address_invalid")
    return "SUPABASE_EMAIL_ADDRESS_INVALID";
  if (error?.code === "email_address_not_authorized")
    return "SUPABASE_EMAIL_ADDRESS_NOT_AUTHORIZED";
  if (error?.code === "email_conflict_identity_not_deletable")
    return "SUPABASE_EMAIL_CONFLICT_IDENTITY_NOT_DELETABLE";
  if (error?.code === "email_exists") return "SUPABASE_EMAIL_EXISTS";
  if (error?.code === "email_not_confirmed")
    return "SUPABASE_EMAIL_NOT_CONFIRMED";
  if (error?.code === "email_provider_disabled")
    return "SUPABASE_EMAIL_PROVIDER_DISABLED";
  if (error?.code === "flow_state_expired")
    return "SUPABASE_FLOW_STATE_EXPIRED";
  if (error?.code === "flow_state_not_found")
    return "SUPABASE_FLOW_STATE_NOT_FOUND";
  if (error?.code === "hook_payload_invalid_content_type")
    return "SUPABASE_HOOK_PAYLOAD_INVALID_CONTENT_TYPE";
  if (error?.code === "hook_payload_over_size_limit")
    return "SUPABASE_HOOK_PAYLOAD_OVER_SIZE_LIMIT";
  if (error?.code === "hook_timeout") return "SUPABASE_HOOK_TIMEOUT";
  if (error?.code === "hook_timeout_after_retry")
    return "SUPABASE_HOOK_TIMEOUT_AFTER_RETRY";
  if (error?.code === "identity_already_exists")
    return "SUPABASE_IDENTITY_ALREADY_EXISTS";
  if (error?.code === "identity_not_found")
    return "SUPABASE_IDENTITY_NOT_FOUND";
  if (error?.code === "insufficient_aal") return "SUPABASE_INSUFFICIENT_AAL";
  if (error?.code === "invite_not_found") return "SUPABASE_INVITE_NOT_FOUND";
  if (error?.code === "invalid_credentials")
    return "SUPABASE_INVALID_CREDENTIALS";
  if (error?.code === "manual_linking_disabled")
    return "SUPABASE_MANUAL_LINKING_DISABLED";
  if (error?.code === "no_authorization") return "SUPABASE_NO_AUTHORIZATION";
  if (error?.code === "not_admin") return "SUPABASE_NOT_ADMIN";
  if (error?.code === "oauth_provider_not_supported")
    return "SUPABASE_OAUTH_PROVIDER_NOT_SUPPORTED";
  if (error?.code === "otp_disabled") return "SUPABASE_OTP_DISABLED";
  if (error?.code === "otp_expired") return "SUPABASE_OTP_EXPIRED";
  if (error?.code === "over_email_send_rate_limit")
    return "SUPABASE_OVER_EMAIL_SEND_RATE_LIMIT";
  if (error?.code === "over_request_rate_limit")
    return "SUPABASE_OVER_REQUEST_RATE_LIMIT";
  if (error?.code === "over_sms_send_rate_limit")
    return "SUPABASE_OVER_SMS_SEND_RATE_LIMIT";
  if (error?.code === "phone_exists") return "SUPABASE_PHONE_EXISTS";
  if (error?.code === "phone_not_confirmed")
    return "SUPABASE_PHONE_NOT_CONFIRMED";
  if (error?.code === "phone_provider_disabled")
    return "SUPABASE_PHONE_PROVIDER_DISABLED";
  if (error?.code === "provider_disabled") return "SUPABASE_PROVIDER_DISABLED";
  if (error?.code === "provider_email_needs_verification")
    return "SUPABASE_PROVIDER_EMAIL_NEEDS_VERIFICATION";
  if (error?.code === "reauthentication_needed")
    return "SUPABASE_REAUTHENTICATION_NEEDED";
  if (error?.code === "reauthentication_not_valid")
    return "SUPABASE_REAUTHENTICATION_NOT_VALID";
  if (error?.code === "refresh_token_not_found")
    return "SUPABASE_REFRESH_TOKEN_NOT_FOUND";
  if (error?.code === "refresh_token_already_used")
    return "SUPABASE_REFRESH_TOKEN_ALREADY_USED";
  if (error?.code === "request_timeout") return "SUPABASE_REQUEST_TIMEOUT";
  if (error?.code === "same_password") return "SUPABASE_SAME_PASSWORD";
  if (error?.code === "saml_assertion_no_email")
    return "SUPABASE_SAML_ASSERTION_NO_EMAIL";
  if (error?.code === "saml_assertion_no_user_id")
    return "SUPABASE_SAML_ASSERTION_NO_USER_ID";
  if (error?.code === "saml_entity_id_mismatch")
    return "SUPABASE_SAML_ENTITY_ID_MISMATCH";
  if (error?.code === "saml_idp_already_exists")
    return "SUPABASE_SAML_IDP_ALREADY_EXISTS";
  if (error?.code === "saml_idp_not_found")
    return "SUPABASE_SAML_IDP_NOT_FOUND";
  if (error?.code === "saml_metadata_fetch_failed")
    return "SUPABASE_SAML_METADATA_FETCH_FAILED";
  if (error?.code === "saml_provider_disabled")
    return "SUPABASE_SAML_PROVIDER_DISABLED";
  if (error?.code === "saml_relay_state_expired")
    return "SUPABASE_SAML_RELAY_STATE_EXPIRED";
  if (error?.code === "saml_relay_state_not_found")
    return "SUPABASE_SAML_RELAY_STATE_NOT_FOUND";
  if (error?.code === "session_expired") return "SUPABASE_SESSION_EXPIRED";
  if (error?.code === "session_not_found") return "SUPABASE_SESSION_NOT_FOUND";
  if (error?.code === "signup_disabled") return "SUPABASE_SIGNUP_DISABLED";
  if (error?.code === "single_identity_not_deletable")
    return "SUPABASE_SINGLE_IDENTITY_NOT_DELETABLE";
  if (error?.code === "sms_send_failed") return "SUPABASE_SMS_SEND_FAILED";
  if (error?.code === "sso_domain_already_exists")
    return "SUPABASE_SSO_DOMAIN_ALREADY_EXISTS";
  if (error?.code === "sso_provider_not_found")
    return "SUPABASE_SSO_PROVIDER_NOT_FOUND";
  if (error?.code === "too_many_enrolled_mfa_factors")
    return "SUPABASE_TOO_MANY_ENROLLED_MFA_FACTORS";
  if (error?.code === "unexpected_audience")
    return "SUPABASE_UNEXPECTED_AUDIENCE";
  if (error?.code === "unexpected_failure")
    return "SUPABASE_UNEXPECTED_FAILURE";
  if (error?.code === "user_already_exists")
    return "SUPABASE_USER_ALREADY_EXISTS";
  if (error?.code === "user_banned") return "SUPABASE_USER_BANNED";
  if (error?.code === "user_not_found") return "SUPABASE_USER_NOT_FOUND";
  if (error?.code === "user_sso_managed") return "SUPABASE_USER_SSO_MANAGED";
  if (error?.code === "validation_failed") return "SUPABASE_VALIDATION_FAILED";
  if (error?.code === "weak_password") return "SUPABASE_WEAK_PASSWORD";

  return "UNKNOWN_ERROR";
}

/** Supabase Storage 에러 매핑 */
function mapSupabaseStorageError(error: any): ErrorCode {
  if (error?.code === "NoSuchBucket") return "SUPABASE_STORAGE_NO_SUCH_BUCKET";
  if (error?.code === "NoSuchKey") return "SUPABASE_STORAGE_NO_SUCH_KEY";
  if (error?.code === "NoSuchUpload") return "SUPABASE_STORAGE_NO_SUCH_UPLOAD";
  if (error?.code === "InvalidJWT") return "SUPABASE_STORAGE_INVALID_JWT";
  if (error?.code === "InvalidRequest")
    return "SUPABASE_STORAGE_INVALID_REQUEST";
  if (error?.code === "TenantNotFound")
    return "SUPABASE_STORAGE_TENANT_NOT_FOUND";
  if (error?.code === "EntityTooLarge")
    return "SUPABASE_STORAGE_ENTITY_TOO_LARGE";
  if (error?.code === "InternalError") return "SUPABASE_STORAGE_INTERNAL_ERROR";
  if (error?.code === "ResourceAlreadyExists")
    return "SUPABASE_STORAGE_RESOURCE_ALREADY_EXISTS";
  if (error?.code === "InvalidBucketName")
    return "SUPABASE_STORAGE_INVALID_BUCKET_NAME";
  if (error?.code === "InvalidKey") return "SUPABASE_STORAGE_INVALID_KEY";
  if (error?.code === "InvalidRange") return "SUPABASE_STORAGE_INVALID_RANGE";
  if (error?.code === "InvalidMimeType")
    return "SUPABASE_STORAGE_INVALID_MIME_TYPE";
  if (error?.code === "InvalidUploadId")
    return "SUPABASE_STORAGE_INVALID_UPLOAD_ID";
  if (error?.code === "KeyAlreadyExists")
    return "SUPABASE_STORAGE_KEY_ALREADY_EXISTS";
  if (error?.code === "BucketAlreadyExists")
    return "SUPABASE_STORAGE_BUCKET_ALREADY_EXISTS";
  if (error?.code === "DatabaseTimeout")
    return "SUPABASE_STORAGE_DATABASE_TIMEOUT";
  if (error?.code === "InvalidSignature")
    return "SUPABASE_STORAGE_INVALID_SIGNATURE";
  if (error?.code === "SignatureDoesNotMatch")
    return "SUPABASE_STORAGE_SIGNATURE_DOES_NOT_MATCH";
  if (error?.code === "AccessDenied") return "SUPABASE_STORAGE_ACCESS_DENIED";
  if (error?.code === "ResourceLocked")
    return "SUPABASE_STORAGE_RESOURCE_LOCKED";
  if (error?.code === "DatabaseError") return "SUPABASE_STORAGE_DATABASE_ERROR";
  if (error?.code === "MissingContentLength")
    return "SUPABASE_STORAGE_MISSING_CONTENT_LENGTH";
  if (error?.code === "MissingParameter")
    return "SUPABASE_STORAGE_MISSING_PARAMETER";
  if (error?.code === "InvalidUploadSignature")
    return "SUPABASE_STORAGE_INVALID_UPLOAD_SIGNATURE";
  if (error?.code === "LockTimeout") return "SUPABASE_STORAGE_LOCK_TIMEOUT";
  if (error?.code === "S3Error") return "SUPABASE_STORAGE_S3_ERROR";
  if (error?.code === "S3InvalidAccessKeyId")
    return "SUPABASE_STORAGE_S3_INVALID_ACCESS_KEY_ID";
  if (error?.code === "S3MaximumCredentialsLimit")
    return "SUPABASE_STORAGE_S3_MAXIMUM_CREDENTIALS_LIMIT";
  if (error?.code === "InvalidChecksum")
    return "SUPABASE_STORAGE_INVALID_CHECKSUM";
  if (error?.code === "MissingPart") return "SUPABASE_STORAGE_MISSING_PART";
  if (error?.code === "SlowDown") return "SUPABASE_STORAGE_SLOW_DOWN";

  return "UNKNOWN_ERROR";
}

/** Supabase Database 에러 매핑 */
function mapSupabaseDatabaseError(error: any): ErrorCode {
  if (error?.code === "08000") return "SUPABASE_DATABASE_CONNECTION_ERROR";
  if (error?.code === "08003") return "SUPABASE_DATABASE_CONNECTION_LOST";
  if (error?.code === "08006") return "SUPABASE_DATABASE_CONNECTION_FAILED";
  if (error?.code === "0P000") return "SUPABASE_DATABASE_DOES_NOT_EXIST";
  if (error?.code === "22000") return "SUPABASE_DATABASE_DATA_PROCESSING_ERROR";
  if (error?.code === "22001") return "SUPABASE_DATABASE_TEXT_TOO_LONG";
  if (error?.code === "22002")
    return "SUPABASE_DATABASE_MISSING_REQUIRED_VALUE";
  if (error?.code === "22003") return "SUPABASE_DATABASE_NUMBER_OUT_OF_RANGE";
  if (error?.code === "22004") return "SUPABASE_DATABASE_INVALID_NULL_VALUE";
  if (error?.code === "22005") return "SUPABASE_DATABASE_INVALID_NUMBER_FORMAT";
  if (error?.code === "22007")
    return "SUPABASE_DATABASE_INVALID_DATETIME_FORMAT";
  if (error?.code === "22008") return "SUPABASE_DATABASE_DATETIME_OUT_OF_RANGE";
  if (error?.code === "22012") return "SUPABASE_DATABASE_DIVISION_BY_ZERO";
  if (error?.code === "22018")
    return "SUPABASE_DATABASE_INVALID_CHARACTER_VALUE";
  if (error?.code === "22019")
    return "SUPABASE_DATABASE_INVALID_ESCAPE_CHARACTER";
  if (error?.code === "22021") return "SUPABASE_DATABASE_INVALID_CHARACTER_SET";
  if (error?.code === "22023")
    return "SUPABASE_DATABASE_INVALID_PARAMETER_VALUE";
  if (error?.code === "22025")
    return "SUPABASE_DATABASE_INVALID_ESCAPE_SEQUENCE";
  if (error?.code === "22026") return "SUPABASE_DATABASE_INVALID_STRING_LENGTH";
  if (error?.code === "22P01")
    return "SUPABASE_DATABASE_FLOATING_POINT_EXCEPTION";
  if (error?.code === "22P02")
    return "SUPABASE_DATABASE_DATA_TYPE_CONVERSION_FAILED";
  if (error?.code === "22P03")
    return "SUPABASE_DATABASE_INVALID_DATETIME_VALUE";
  if (error?.code === "22P04")
    return "SUPABASE_DATABASE_NULL_VALUE_NOT_ALLOWED";
  if (error?.code === "22P05") return "SUPABASE_DATABASE_INVALID_XML_VALUE";
  if (error?.code === "23000")
    return "SUPABASE_DATABASE_INTEGRITY_CONSTRAINT_VIOLATION";
  if (error?.code === "23502") return "SUPABASE_DATABASE_REQUIRED_FIELD_EMPTY";
  if (error?.code === "23503")
    return "SUPABASE_DATABASE_REFERENCED_RECORD_NOT_FOUND";
  if (error?.code === "23505") return "SUPABASE_DATABASE_RECORD_ALREADY_EXISTS";
  if (error?.code === "23514")
    return "SUPABASE_DATABASE_DATA_CONDITION_NOT_MET";
  if (error?.code === "25000")
    return "SUPABASE_DATABASE_INVALID_TRANSACTION_STATE";
  if (error?.code === "25P02") return "SUPABASE_DATABASE_TRANSACTION_ABORTED";
  if (error?.code === "28000") return "SUPABASE_DATABASE_AUTHENTICATION_FAILED";
  if (error?.code === "28P01") return "SUPABASE_DATABASE_INVALID_PASSWORD";
  if (error?.code === "3D000") return "SUPABASE_DATABASE_SCHEMA_DOES_NOT_EXIST";
  if (error?.code === "3F000") return "SUPABASE_DATABASE_SCHEMA_DOES_NOT_EXIST";
  if (error?.code === "40001") return "SUPABASE_DATABASE_SERIALIZATION_FAILURE";
  if (error?.code === "40P01") return "SUPABASE_DATABASE_DEADLOCK_DETECTED";
  if (error?.code === "42000")
    return "SUPABASE_DATABASE_SYNTAX_ERROR_OR_PERMISSION_VIOLATION";
  if (error?.code === "42501")
    return "SUPABASE_DATABASE_INSUFFICIENT_PRIVILEGE";
  if (error?.code === "42601") return "SUPABASE_DATABASE_SQL_SYNTAX_ERROR";
  if (error?.code === "42602") return "SUPABASE_DATABASE_INVALID_IDENTIFIER";
  if (error?.code === "42701") return "SUPABASE_DATABASE_DUPLICATE_COLUMN_NAME";
  if (error?.code === "42702")
    return "SUPABASE_DATABASE_AMBIGUOUS_COLUMN_REFERENCE";
  if (error?.code === "42703") return "SUPABASE_DATABASE_UNDEFINED_COLUMN";
  if (error?.code === "42704")
    return "SUPABASE_DATABASE_UNDEFINED_DATABASE_OBJECT";
  if (error?.code === "42710") return "SUPABASE_DATABASE_OBJECT_ALREADY_EXISTS";
  if (error?.code === "42712") return "SUPABASE_DATABASE_AMBIGUOUS_ALIAS";
  if (error?.code === "42803") return "SUPABASE_DATABASE_GROUPING_ERROR";
  if (error?.code === "42804") return "SUPABASE_DATABASE_DATA_TYPE_MISMATCH";
  if (error?.code === "42830")
    return "SUPABASE_DATABASE_INVALID_FOREIGN_KEY_DEFINITION";
  if (error?.code === "42883")
    return "SUPABASE_DATABASE_UNDEFINED_FUNCTION_OR_OPERATOR";
  if (error?.code === "42P01") return "SUPABASE_DATABASE_UNDEFINED_TABLE";
  if (error?.code === "42P02") return "SUPABASE_DATABASE_UNDEFINED_PARAMETER";
  if (error?.code === "42P07") return "SUPABASE_DATABASE_TABLE_ALREADY_EXISTS";
  if (error?.code === "42P18")
    return "SUPABASE_DATABASE_INDETERMINATE_DATA_TYPE_ERROR";
  if (error?.code === "53000")
    return "SUPABASE_DATABASE_INSUFFICIENT_RESOURCES";
  if (error?.code === "53100") return "SUPABASE_DATABASE_DISK_SPACE_EXHAUSTED";
  if (error?.code === "53200") return "SUPABASE_DATABASE_MEMORY_EXHAUSTED";
  if (error?.code === "53300")
    return "SUPABASE_DATABASE_MAX_CONNECTIONS_REACHED";
  if (error?.code === "54000")
    return "SUPABASE_DATABASE_PROGRAM_LIMIT_EXCEEDED";
  if (error?.code === "54001") return "SUPABASE_DATABASE_STATEMENT_TOO_COMPLEX";
  if (error?.code === "54011") return "SUPABASE_DATABASE_TOO_MANY_COLUMNS";
  if (error?.code === "54023")
    return "SUPABASE_DATABASE_TOO_MUCH_MEMORY_REQUESTED";
  if (error?.code === "55000") return "SUPABASE_DATABASE_INVALID_OBJECT_STATE";
  if (error?.code === "55006") return "SUPABASE_DATABASE_OBJECT_IN_USE";
  if (error?.code === "55P03") return "SUPABASE_DATABASE_LOCK_NOT_AVAILABLE";
  if (error?.code === "57014") return "SUPABASE_DATABASE_QUERY_CANCELLED";
  if (error?.code === "58P01") return "SUPABASE_DATABASE_FILE_ACCESS_ERROR";
  if (error?.code === "P0001") return "SUPABASE_DATABASE_CUSTOM_ERROR";
  if (error?.code === "P0002") return "SUPABASE_DATABASE_NO_DATA_FOUND";
  if (error?.code === "P0003") return "SUPABASE_DATABASE_TOO_MANY_ROWS";
  if (error?.code === "P0004") return "SUPABASE_DATABASE_ASSERTION_FAILURE";
  if (error?.code === "PGRST000")
    return "SUPABASE_DATABASE_CONNECTION_UNAVAILABLE";
  if (error?.code === "PGRST001")
    return "SUPABASE_DATABASE_INVALID_DATABASE_ROLE";
  if (error?.code === "PGRST002")
    return "SUPABASE_DATABASE_SCHEMA_ACCESS_DENIED";
  if (error?.code === "PGRST100")
    return "SUPABASE_DATABASE_SCHEMA_CACHE_LOAD_FAILED";
  if (error?.code === "PGRST101")
    return "SUPABASE_DATABASE_JWT_TOKEN_INVALID_OR_EXPIRED";
  if (error?.code === "PGRST102")
    return "SUPABASE_DATABASE_JWT_SECRET_MISSING_OR_INVALID";
  if (error?.code === "PGRST103")
    return "SUPABASE_DATABASE_JWT_ROLE_CLAIM_INVALID";
  if (error?.code === "PGRST105")
    return "SUPABASE_DATABASE_JWT_DATABASE_ROLE_NOT_FOUND";
  if (error?.code === "PGRST106")
    return "SUPABASE_DATABASE_SERVER_CONFIGURATION_INVALID";
  if (error?.code === "PGRST107")
    return "SUPABASE_DATABASE_UNSUPPORTED_MEDIA_TYPE";
  if (error?.code === "PGRST108") return "SUPABASE_DATABASE_SCHEMA_NOT_EXPOSED";
  if (error?.code === "PGRST109")
    return "SUPABASE_DATABASE_TABLE_OR_VIEW_NOT_EXPOSED";
  if (error?.code === "PGRST110")
    return "SUPABASE_DATABASE_FUNCTION_NOT_EXPOSED_OR_NOT_FOUND";
  if (error?.code === "PGRST111")
    return "SUPABASE_DATABASE_VOLATILE_FUNCTION_CALL_NOT_ALLOWED";
  if (error?.code === "PGRST112")
    return "SUPABASE_DATABASE_REQUEST_BODY_INVALID";
  if (error?.code === "PGRST113")
    return "SUPABASE_DATABASE_INVALID_QUERY_PARAMETER";
  if (error?.code === "PGRST114")
    return "SUPABASE_DATABASE_INVALID_HTTP_HEADER";
  if (error?.code === "PGRST116")
    return "SUPABASE_DATABASE_SECURITY_POLICY_VIOLATION";
  if (error?.code === "PGRST117")
    return "SUPABASE_DATABASE_REQUESTED_RESOURCE_NOT_FOUND";
  if (error?.code === "PGRST200")
    return "SUPABASE_DATABASE_REQUESTED_RANGE_NOT_SATISFIABLE";
  if (error?.code === "PGRST201")
    return "SUPABASE_DATABASE_INVALID_FILTER_OR_ORDER_PARAMETER";
  if (error?.code === "PGRST202") return "SUPABASE_DATABASE_COLUMN_NOT_FOUND";
  if (error?.code === "PGRST300")
    return "SUPABASE_DATABASE_BULK_INSERT_OR_UPDATE_ERROR";
  if (error?.code === "PGRST301")
    return "SUPABASE_DATABASE_OPERATION_NOT_ALLOWED";
  if (error?.code === "PGRST302")
    return "SUPABASE_DATABASE_AFFECTED_ROW_COUNT_MISMATCH";

  return "UNKNOWN_ERROR";
}

export function getErrorInfo(code: ErrorCode): ErrorInfo {
  return COMBINED_ERROR_MAP[code] ?? COMBINED_ERROR_MAP.UNKNOWN_ERROR;
}

export function makeErrorResponse(code: ErrorCode, detail?: string) {
  const { message } = getErrorInfo(code);
  return {
    success: false,
    error: code,
    message: detail || message,
  };
}

export function makeErrorResponseFromResult(
  errorResult: ReturnType<typeof getErrorResultFromRawError>,
  customMessage?: string
) {
  return {
    success: false,
    error: errorResult.code,
    message: customMessage || errorResult.message,
    detail: errorResult.detail,
    additionalData: errorResult.params,
  };
}

export function getErrorResultFromRawError(
  error: any,
  params?: Record<string, any>,
  type?: ErrorType
) {
  const code = error?.businessCode || mapRawErrorToCode(error, type);
  const errorInfo = getErrorInfo(code);

  let message;
  try {
    if (typeof errorInfo.message === "function") {
      message = errorInfo.message(params || error.params);
    } else if (typeof errorInfo.message === "string") {
      message = errorInfo.message;
    } else {
      message = "알 수 없는 오류가 발생했습니다.";
    }
  } catch {
    message = "알 수 없는 오류가 발생했습니다.";
  }

  return {
    code,
    message,
    status: errorInfo.status,
    params: params || error.params || null,
    detail: error?.originalMessage || error?.message || null,
  };
}

export function getErrorMessage(
  code: ErrorCode,
  params?: Record<string, any>
): string {
  const errorInfo = COMBINED_ERROR_MAP[code];
  if (!errorInfo) return "알 수 없는 오류가 발생했습니다.";

  const { message } = errorInfo;
  try {
    if (typeof message === "function") return message(params || {});
    if (typeof message === "string") return message;
    return "알 수 없는 오류가 발생했습니다.";
  } catch {
    return "알 수 없는 오류가 발생했습니다.";
  }
}

export function throwBusinessError(
  code: ErrorCode,
  params?: Record<string, any>,
  originalError?: any
): never {
  const error = new Error(getErrorMessage(code, params));
  (error as any).businessCode = code;
  (error as any).params = params;

  // 원본 에러 메시지를 originalMessage로 저장
  if (originalError?.message) {
    (error as any).originalMessage = originalError.message;
  }

  throw error;
}
