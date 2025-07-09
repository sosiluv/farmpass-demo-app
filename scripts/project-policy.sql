-- profiles 테이블 정책 삭제
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Farm owners can view member profiles" ON public.profiles;
DROP POLICY IF EXISTS "Service role can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Farm owners and managers can view profiles for member management" ON public.profiles;

-- farms 테이블 정책 삭제
DROP POLICY IF EXISTS "Users can view own farms" ON public.farms;
DROP POLICY IF EXISTS "Users can manage own farms" ON public.farms;
DROP POLICY IF EXISTS "Public can view active farms for visitor registration" ON public.farms;

-- farm_members 테이블 정책 삭제
DROP POLICY IF EXISTS "Users can view farm members" ON public.farm_members;
DROP POLICY IF EXISTS "Farm owners can manage members" ON public.farm_members;

-- visitor_entries 테이블 정책 삭제
DROP POLICY IF EXISTS "Users can view farm visitors" ON public.visitor_entries;
DROP POLICY IF EXISTS "Users can manage farm visitors" ON public.visitor_entries;
DROP POLICY IF EXISTS "Anyone can register visitors" ON public.visitor_entries;
-- DROP POLICY IF EXISTS "Visitors can view own entries via session token" ON public.visitor_entries;
-- DROP POLICY IF EXISTS "Visitors can update own entries via session token" ON public.visitor_entries;

-- system_settings 테이블 정책 삭제
DROP POLICY IF EXISTS "Admins can manage all system settings" ON public.system_settings;

-- system_logs 테이블 정책 삭제
DROP POLICY IF EXISTS "system_logs_admin_full_access" ON public.system_logs;
DROP POLICY IF EXISTS "system_logs_insert" ON public.system_logs;
DROP POLICY IF EXISTS "system_logs_select" ON public.system_logs;

-- push_subscriptions 테이블 정책 삭제
DROP POLICY IF EXISTS "allow_all" ON public.push_subscriptions;

-- user_notification_settings 테이블 정책 삭제
DROP POLICY IF EXISTS "allow_all" ON public.user_notification_settings;

-- =================================
-- 관리자 확인 함수 (RLS 우회 방식)
-- =================================
CREATE OR REPLACE FUNCTION public.is_system_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result BOOLEAN;
BEGIN
    -- RLS를 우회하여 직접 조회 (SECURITY DEFINER로 인해 RLS 무시)
    SELECT account_type = 'admin'
    INTO result
    FROM public.profiles
    WHERE id = auth.uid();
    
    RETURN COALESCE(result, FALSE);
EXCEPTION
    WHEN OTHERS THEN
        -- 조회 실패 시 기본적으로 false 반환
        RETURN FALSE;
END;
$$;

COMMENT ON FUNCTION public.is_system_admin() IS 
'RLS를 우회하여 profiles.account_type으로 관리자 확인. 재귀 방지 및 실시간 권한 변경 지원';

-- =================================
-- 관리자 계정 role부여 해야함 무조건필수
-- =================================
UPDATE auth.users
SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || '{"role": "admin"}'
WHERE id = 'a45d5a0f-4f1b-4815-9574-9971e17901fd';

-- =================================
-- profiles 테이블 정책 (함수 기반, 무한 재귀 완전 방지)
-- =================================
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
    FOR SELECT USING (public.is_system_admin());

-- 농장 소유자와 관리자가 멤버 추가를 위해 다른 사용자 프로필 조회 가능
CREATE POLICY "Farm owners and managers can view profiles for member management" ON public.profiles
    FOR SELECT USING (
        public.is_system_admin() OR
        auth.uid() IN (
            SELECT owner_id FROM public.farms
        ) OR
        auth.uid() IN (
            SELECT user_id FROM public.farm_members 
            WHERE is_active = true AND role = 'manager'
        )
    );

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can update all profiles" ON public.profiles
    FOR UPDATE USING (public.is_system_admin());

COMMENT ON POLICY "Users can view own profile" ON public.profiles IS 
'사용자는 자신의 프로필만 조회할 수 있음';

COMMENT ON POLICY "Admins can view all profiles" ON public.profiles IS 
'is_system_admin() 함수로 관리자 확인 후 모든 프로필을 조회할 수 있음';

COMMENT ON POLICY "Farm owners and managers can view profiles for member management" ON public.profiles IS 
'농장 소유자와 농장 관리자는 멤버 추가를 위해 다른 사용자의 프로필을 조회할 수 있음';

COMMENT ON POLICY "Users can update own profile" ON public.profiles IS 
'사용자는 자신의 프로필만 수정할 수 있음';

COMMENT ON POLICY "Admins can update all profiles" ON public.profiles IS 
'is_system_admin() 함수로 관리자 확인 후 모든 프로필을 수정할 수 있음';


-- =================================
-- farms 테이블 정책 (함수 기반, 순환 참조 완전 제거)
-- =================================
CREATE POLICY "Users can view own farms" ON public.farms
    FOR SELECT USING (
        public.is_system_admin() OR
        owner_id = auth.uid()
    );

CREATE POLICY "Users can manage own farms" ON public.farms
    FOR ALL USING (
        public.is_system_admin() OR
        owner_id = auth.uid()
    );
  

COMMENT ON POLICY "Users can view own farms" ON public.farms IS 
'사용자는 자신이 소유한 농장만 조회 가능, 관리자는 모든 농장 조회 가능';

COMMENT ON POLICY "Users can manage own farms" ON public.farms IS 
'사용자는 자신이 소유한 농장만 관리 가능, 관리자는 모든 농장 관리 가능';



-- =================================
-- farm_members 테이블 정책 (함수 기반, 순환 참조 완전 제거)
-- =================================
CREATE POLICY "Users can view farm members" ON public.farm_members
    FOR SELECT USING (
        public.is_system_admin() OR
        user_id = auth.uid() OR
        farm_id IN (
            SELECT id FROM public.farms WHERE owner_id = auth.uid()
        )
    );

CREATE POLICY "Farm owners can manage members" ON public.farm_members
    FOR ALL USING (
        public.is_system_admin() OR
        farm_id IN (
            SELECT id FROM public.farms WHERE owner_id = auth.uid()
        )
    );

COMMENT ON POLICY "Users can view farm members" ON public.farm_members IS 
'사용자는 자신의 멤버십 정보와 자신이 소유한 농장의 멤버를 조회 가능, 관리자는 모든 멤버 조회 가능';

COMMENT ON POLICY "Farm owners can manage members" ON public.farm_members IS 
'농장 소유자는 자신의 농장 멤버를 관리 가능, 관리자는 모든 농장 멤버 관리 가능';


-- =================================
-- visitor_entries 테이블 정책 (함수 기반, 순환 참조 완전 제거)
-- =================================
CREATE POLICY "Users can view farm visitors" ON public.visitor_entries
    FOR SELECT USING (
        public.is_system_admin() OR
        farm_id IN (
            SELECT id FROM public.farms WHERE owner_id = auth.uid()
        ) OR
        farm_id IN (
            SELECT farm_id FROM public.farm_members
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

CREATE POLICY "Users can manage farm visitors" ON public.visitor_entries
    FOR ALL USING (
        public.is_system_admin() OR
        farm_id IN (
            SELECT id FROM public.farms WHERE owner_id = auth.uid()
        ) OR
        farm_id IN (
            SELECT farm_id FROM public.farm_members
            WHERE user_id = auth.uid() AND is_active = true AND role = 'manager'
        )
    );

-- 방문자 등록 정책 (공개 접근) - 개선된 버전
CREATE POLICY "Anyone can register visitors" ON public.visitor_entries
    FOR INSERT WITH CHECK (
        -- 공개 방문자 등록은 항상 허용
        true
    );

-- -- 방문자 자신의 정보 조회 정책 (세션 토큰 기반)
-- CREATE POLICY "Visitors can view own entries via session token" ON public.visitor_entries
--     FOR SELECT USING (
--         -- 세션 토큰이 일치하는 경우 (방문자 본인 확인용)
--         session_token IS NOT NULL AND 
--         current_setting('request.headers', true)::json->>'x-session-token' = session_token
--     );

-- -- 방문자 자신의 정보 수정 정책 (세션 토큰 기반)
-- CREATE POLICY "Visitors can update own entries via session token" ON public.visitor_entries
--     FOR UPDATE USING (
--         -- 세션 토큰이 일치하는 경우 (방문자 본인 수정용)
--         session_token IS NOT NULL AND 
--         current_setting('request.headers', true)::json->>'x-session-token' = session_token AND
--         -- 생성 후 24시간 이내에만 수정 가능
--         created_at > (now() - interval '24 hours')
--     );

COMMENT ON POLICY "Users can view farm visitors" ON public.visitor_entries IS 
'농장 소유자, 멤버, 관리자는 해당 농장의 방문자 정보를 조회할 수 있음';

COMMENT ON POLICY "Users can manage farm visitors" ON public.visitor_entries IS 
'농장 소유자, 매니저 권한 이상의 멤버, 관리자는 해당 농장의 방문자 정보를 관리할 수 있음';

COMMENT ON POLICY "Anyone can register visitors" ON public.visitor_entries IS 
'누구나 방문자 등록이 가능함 (공개 접근)';

-- COMMENT ON POLICY "Visitors can view own entries via session token" ON public.visitor_entries IS 
-- '방문자는 세션 토큰을 통해 자신의 등록 정보를 조회할 수 있음';

-- COMMENT ON POLICY "Visitors can update own entries via session token" ON public.visitor_entries IS 
-- '방문자는 세션 토큰을 통해 등록 후 24시간 이내에 자신의 정보를 수정할 수 있음';



-- =================================
-- system_settings 테이블 정책 (함수 기반)
-- =================================
CREATE POLICY "Admins can manage all system settings" ON "public"."system_settings"
  FOR ALL
  TO authenticated
  USING (public.is_system_admin())
  WITH CHECK (public.is_system_admin());    

COMMENT ON POLICY "Admins can manage all system settings" ON public.system_settings IS 
'시스템 설정은 관리자만 생성, 조회, 수정, 삭제할 수 있음';


-- =================================
-- system_logs 테이블 정책 (함수 기반, UUID 타입 준수)
-- =================================
CREATE POLICY "system_logs_admin_full_access" ON public.system_logs
    FOR ALL 
    USING (public.is_system_admin())
    WITH CHECK (public.is_system_admin());

COMMENT ON POLICY "system_logs_admin_full_access" ON public.system_logs IS 
'관리자는 모든 시스템 로그에 대한 전체 권한(CRUD)을 가짐';

-- =================================
-- 포괄적 로그 삽입 정책 (함수 기반, 모든 로그 타입 지원)
-- =================================
CREATE POLICY "system_logs_insert" ON public.system_logs
    FOR INSERT 
    WITH CHECK (
        -- 관리자는 모든 로그 생성 가능
        public.is_system_admin() OR
        
        -- 서비스 역할은 모든 로그 생성 가능
        auth.role() = 'service_role' OR
        
        -- 인증된 사용자는 자신의 로그 및 시스템 로그 생성 가능
        (auth.uid() IS NOT NULL AND (
            user_id = auth.uid() OR
            user_id IS NULL  -- 시스템 로그
        )) OR
        
        -- 🔥 외부(미인증) 사용자도 특정 로그 생성 허용 - 실제 사용되는 모든 액션 포함
        (auth.uid() IS NULL AND (
            -- 사용자 관련 로그
            action ~ '^(USER_|LOGIN_|LOGOUT_|PASSWORD_|ACCOUNT_|SESSION_|AUTH_)' OR
            
            -- 농장 관련 로그
            action ~ '^(FARM_|MEMBER_)' OR
            
            -- 방문자 관련 로그 (모든 방문자 액션 허용)
            action ~ '^(VISITOR_|LIST_VIEW|DETAIL_VIEW|CREATED|UPDATED|DELETED)' OR
            action IN ('CREATION_FAILED', 'UPDATE_FAILED', 'DELETE_FAILED') OR
            
            -- 시스템 설정 관련 로그
            action ~ '^(SETTINGS_|CONFIGURATION_)' OR
            action = 'SETTINGS_INITIALIZE' OR
            action = 'SETTINGS_BULK_UPDATE' OR
            
            -- 푸시 알림 관련 로그
            action ~ '^(PUSH_|NOTIFICATION_)' OR
            
            -- 관리 기능 로그
            action ~ '^(LOG_|DATA_|EXPORT_|IMPORT_|SYSTEM_|BACKUP_|RESTORE_)' OR
            
            -- 애플리케이션 라이프사이클 로그
            action IN ('PAGE_VIEW', 'APP_START', 'APP_END', 'BUSINESS_EVENT', 'USER_ACTIVITY', 'ADMIN_ACTION') OR
            
            -- 보안 관련 로그
            action ~ '^(UNAUTHORIZED_|SECURITY_|SUSPICIOUS_|ACCESS_|PERMISSION_|IP_|RATE_LIMIT_)' OR
            
            -- 에러 관련 로그 (모든 _ERROR, _FAILED 패턴)
            action ~ '_(ERROR|FAILED|WARNING)$' OR
            action ~ '^(ERROR_|FAILED_|WARNING_)' OR
            
            -- API 및 데이터베이스 로그
            action ~ '^(API_|DATABASE_|CONNECTION_|TIMEOUT_|QUERY_|TRANSACTION_)' OR
            
            -- 파일 및 업로드 로그
            action ~ '^(FILE_|IMAGE_|UPLOAD_|STORAGE_)' OR
            
            -- 유효성 검사 로그
            action ~ '^(VALIDATION_|FORM_|INPUT_|DATA_VALIDATION_)' OR
            
            -- 성능 관련 로그
            action ~ '^(PERFORMANCE_|SLOW_|MEMORY_|CPU_|DISK_)' OR
            
            -- 기타 일반적인 로그 패턴
            action ~ '^(BULK_|EMAIL_|CACHE_|MAINTENANCE_|CLEANUP_|MIGRATION_)' OR
            
            -- 알림 관련 로그
            action ~ '_(ALERT|NOTIFICATION)' OR
            
            -- QR 코드 관련 로그
            action ~ '^(QR_|SCAN_)' OR
            
            -- 디버그 로그
            action ~ '^(DEBUG_|DEV_|TEST_)' OR
            
            -- 기본 시스템 로그는 항상 허용
            action IS NULL OR
            action = ''
        )) OR
        
        -- 📝 명시적으로 허용되는 특정 액션들 (실제 코드에서 사용됨)
        (action IN (
            'PAGE_VIEW', 'LOG_CREATION_FAILED', 'SYSTEM_ERROR',
            'LOGIN_ATTEMPTS_RESET', 'PASSWORD_RESET', 'EMAIL_VERIFICATION',
            'VISITOR_DATA_CREATED', 'VISITOR_DATA_CREATION_FAILED', 'VISITOR_CREATED',
            'LIST_VIEW', 'LIST_VIEW_FAILED', 'DETAIL_VIEW', 'DETAIL_VIEW_FAILED',
            'SETTINGS_INITIALIZE', 'SETTINGS_BULK_UPDATE', 'SETTINGS_UPDATED',
            'PUSH_SUBSCRIPTION_CREATED', 'PUSH_SUBSCRIPTION_DELETED', 'PUSH_NOTIFICATION_SENT',
            'PUSH_NOTIFICATION_NO_SUBSCRIBERS', 'PUSH_NOTIFICATION_FILTERED_OUT', 'PUSH_SUBSCRIPTION_CLEANUP', 
            'PUSH_NOTIFICATION_SEND_FAILED',
            'LOG_CLEANUP', 'LOG_CLEANUP_ERROR', 'LOG_EXPORT', 'LOG_EXPORT_ERROR', 'DATA_EXPORT',
            'BROADCAST_NOTIFICATION_SENT', 'BROADCAST_NOTIFICATION_FAILED',
            'UNAUTHORIZED_ACCESS', 'SECURITY_THREAT_DETECTED', 'PERMISSION_DENIED',
            'FARM_CREATED', 'FARM_UPDATED', 'FARM_DELETED', 'FARM_CREATE_FAILED',
            'MEMBER_CREATED', 'MEMBER_UPDATED', 'MEMBER_DELETED', 'MEMBER_ROLE_CHANGED',
            'USER_LOGIN', 'USER_LOGOUT', 'LOGIN_FAILED', 'ACCOUNT_LOCKED',
            'API_ERROR', 'DATABASE_ERROR', 'VALIDATION_ERROR', 'FILE_UPLOAD_ERROR',
            'PERFORMANCE_WARNING', 'SLOW_QUERY', 'MEMORY_WARNING',
            'EXPORT_FAILED', 'CREATED', 'UPDATED', 'DELETED'
        )) OR
        
        -- 🔧 user_id가 undefined/null인 시스템 로그는 항상 허용
        (user_id IS NULL)
    );

COMMENT ON POLICY "system_logs_insert" ON public.system_logs IS 
'포괄적 로그 삽입 정책: 코드베이스에서 실제 사용하는 모든 로그 액션 패턴을 허용. 인증된 사용자, 외부 사용자, 시스템 로그 모두 지원';

-- =================================
-- 로그 조회 정책 (함수 기반)
-- =================================
CREATE POLICY "system_logs_select" ON public.system_logs
    FOR SELECT 
    USING (
        -- 관리자는 모든 로그 조회 가능
        public.is_system_admin() OR
        
        -- 인증된 사용자는 자신과 관련된 로그만 조회 가능
        (auth.uid() IS NOT NULL AND (
            user_id = auth.uid() OR
            user_id IS NULL  -- 시스템 로그는 모든 인증된 사용자가 조회 가능
        ))
    );

COMMENT ON POLICY "system_logs_select" ON public.system_logs IS 
'로그 조회 정책: 관리자는 모든 로그, 일반 사용자는 자신의 로그와 시스템 로그만 조회 가능';


-- =================================
-- push_subscriptions 테이블 정책
-- =================================
CREATE POLICY "allow_all" ON public.push_subscriptions
    FOR ALL USING (true);

COMMENT ON POLICY "allow_all" ON public.push_subscriptions IS 
'모든 사용자는 모든 구독 정보에 접근 가능합니다.';

-- =================================
-- user_notification_settings 테이블 정책
-- =================================
CREATE POLICY "allow_all" ON public.user_notification_settings
    FOR ALL USING (true);

COMMENT ON POLICY "allow_all" ON public.user_notification_settings IS 
'모든 사용자는 모든 알림 설정에 접근 가능합니다.';
