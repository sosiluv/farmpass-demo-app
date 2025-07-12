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
-- profiles 테이블 정책 (Prisma 호환, 멤버 관리 최적화)
-- =================================
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
    FOR SELECT USING (public.is_system_admin());

-- 농장 소유자와 관리자가 멤버 추가를 위해 다른 사용자 프로필 조회 가능 (Prisma에서 세밀한 권한 체크)
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
-- farms 테이블 정책 (Prisma 호환, 구성원 접근 권한 강화)
-- =================================
CREATE POLICY "Users can view own farms" ON public.farms
    FOR SELECT USING (
        public.is_system_admin() OR
        owner_id = auth.uid() OR
        id IN (
            SELECT farm_id FROM public.farm_members 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

CREATE POLICY "Users can manage own farms" ON public.farms
    FOR ALL USING (
        public.is_system_admin() OR
        owner_id = auth.uid()
    );


COMMENT ON POLICY "Users can view own farms" ON public.farms IS 
'사용자는 자신이 소유한 농장과 구성원으로 속한 농장을 조회 가능, 관리자는 모든 농장 조회 가능';

COMMENT ON POLICY "Users can manage own farms" ON public.farms IS 
'사용자는 자신이 소유한 농장만 관리 가능, 관리자는 모든 농장 관리 가능';



-- =================================
-- farm_members 테이블 정책 (Prisma 호환, 세밀한 권한 제어)
-- =================================
CREATE POLICY "Users can view farm members" ON public.farm_members
    FOR SELECT USING (
        public.is_system_admin() OR
        user_id = auth.uid() OR
        farm_id IN (
            SELECT id FROM public.farms WHERE owner_id = auth.uid()
        ) OR
        farm_id IN (
            SELECT farm_id FROM public.farm_members 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

-- 농장 소유자와 관리자만 멤버 관리 가능 (Prisma에서 세밀한 권한 체크)
CREATE POLICY "Farm owners and managers can manage members" ON public.farm_members
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

COMMENT ON POLICY "Users can view farm members" ON public.farm_members IS 
'사용자는 자신의 멤버십 정보, 자신이 소유한 농장의 멤버, 자신이 속한 농장의 멤버를 조회 가능, 관리자는 모든 멤버 조회 가능';

COMMENT ON POLICY "Farm owners and managers can manage members" ON public.farm_members IS 
'농장 소유자와 농장 관리자(manager)는 자신의 농장 멤버를 관리 가능, 시스템 관리자는 모든 농장 멤버 관리 가능';


-- =================================
-- visitor_entries 테이블 정책 (Prisma 호환, 방문자 관리 최적화)
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

