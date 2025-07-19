

-- 인증된 사용자에게 테이블 접근 권한 부여
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- service_role 유저에게 public 스키마 사용 권한 부여
GRANT USAGE ON SCHEMA public TO service_role;
-- service_role 유저에게 system_logs 테이블에 대한 모든 권한 부여
GRANT INSERT, SELECT, UPDATE, DELETE ON TABLE public.system_logs TO service_role;


-- RLS 활성화
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farm_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visitor_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_notification_settings ENABLE ROW LEVEL SECURITY;

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
-- farms row 접근 가능 여부 함수 (무한 재귀 방지)
-- =================================
CREATE OR REPLACE FUNCTION public.can_access_farm(farm_row public.farms)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN
    farm_row.owner_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.farm_members
      WHERE farm_id = farm_row.id AND user_id = auth.uid()
    )
    OR public.is_system_admin();
END;
$$;

COMMENT ON FUNCTION public.can_access_farm IS 'farms row 접근 가능 여부를 SECURITY DEFINER로 체크(RLS 무한 재귀 방지)';

-- =================================
-- profiles 테이블 정책 (실제 클라이언트 사용 기준 최소화)
-- =================================

-- 내 프로필만 조회
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

-- 내 프로필만 수정
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- 관리자 전체 조회/수정
CREATE POLICY "Admins can manage all profiles" ON public.profiles
    FOR ALL USING (public.is_system_admin());

COMMENT ON POLICY "Users can view own profile" ON public.profiles IS 
'사용자는 자신의 프로필만 조회할 수 있음';

COMMENT ON POLICY "Users can update own profile" ON public.profiles IS 
'사용자는 자신의 프로필만 수정할 수 있음';

COMMENT ON POLICY "Admins can manage all profiles" ON public.profiles IS 
'is_system_admin() 함수로 관리자 확인 후 모든 프로필을 조회할 수 있음';


-- =================================
-- farms 테이블 정책 (SELECT만 함수 기반, 나머지 정책 제거)
-- =================================

-- 무한 재귀 방지 함수로만 권한 체크 (SELECT만 허용)
CREATE POLICY "Users can view own farms" ON public.farms
    FOR SELECT USING (public.can_access_farm(farms));


COMMENT ON POLICY "Users can view own farms" ON public.farms IS 
'사용자는 자신이 소유한 농장과 구성원으로 속한 농장을 조회 가능, 관리자는 모든 농장 조회 가능';



-- =================================
-- farm_members 테이블 정책 (RLS 실제 사용 기준, 함수 기반)
-- =================================

CREATE POLICY "Users can view farm members" ON public.farm_members
    FOR SELECT USING (
        public.is_system_admin() OR
        public.can_access_farm((SELECT f FROM public.farms f WHERE f.id = farm_members.farm_id))
    );


COMMENT ON POLICY "Users can view farm members" ON public.farm_members IS 
'사용자는 자신의 멤버십 정보, 자신이 소유한 농장의 멤버, 자신이 속한 농장의 멤버를 조회 가능, 관리자는 모든 멤버 조회 가능';


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
            WHERE user_id = auth.uid()
        )
    );

COMMENT ON POLICY "Users can view farm visitors" ON public.visitor_entries IS 
'농장 소유자, 멤버, 관리자는 해당 농장의 방문자 정보를 조회할 수 있음';


-- =================================
-- system_settings 테이블 정책
-- =================================
CREATE POLICY "Admins can manage all system settings" ON "public"."system_settings"
  FOR ALL
  TO authenticated
  USING (public.is_system_admin())
  WITH CHECK (public.is_system_admin());    

COMMENT ON POLICY "Admins can manage all system settings" ON public.system_settings IS 
'시스템 설정은 관리자만 생성, 조회, 수정, 삭제할 수 있음';


-- =================================
-- system_logs 테이블 정책 
-- =================================
CREATE POLICY "system_logs_admin_full_access" ON public.system_logs
    FOR ALL 
    USING (public.is_system_admin())
    WITH CHECK (public.is_system_admin());


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

COMMENT ON POLICY "system_logs_admin_full_access" ON public.system_logs IS 
'관리자는 모든 시스템 로그에 대한 전체 권한(CRUD)을 가짐';

COMMENT ON POLICY "system_logs_select" ON public.system_logs IS 
'로그 조회 정책: 관리자는 모든 로그, 일반 사용자는 자신의 로그와 시스템 로그만 조회 가능';


-- =================================
-- push_subscriptions 테이블 정책 (실제 미들웨어 동작 기준 최소화)
-- =================================

-- 인증된 사용자(본인)만 자신의 push_subscriptions 삭제 가능
CREATE POLICY "Users can delete own push subscriptions" ON public.push_subscriptions
  FOR DELETE
  USING (
    auth.uid() IS NOT NULL AND user_id = auth.uid()
  );

COMMENT ON POLICY "Users can delete own push subscriptions" ON public.push_subscriptions IS 
'인증된 사용자는 본인 user_id에 해당하는 push_subscriptions만 삭제 가능';










-- 사용자 프로필 테이블 주석
COMMENT ON TABLE public.profiles IS '사용자 프로필 정보를 저장하는 테이블';
COMMENT ON COLUMN public.profiles.id IS '사용자 고유 ID (auth.users와 연결)';
COMMENT ON COLUMN public.profiles.email IS '사용자 이메일 주소 (로그인 ID)';
COMMENT ON COLUMN public.profiles.name IS '사용자 실명';
COMMENT ON COLUMN public.profiles.phone IS '연락처 전화번호';
COMMENT ON COLUMN public.profiles.account_type IS '계정 유형: admin(관리자), user(일반사용자)';
COMMENT ON COLUMN public.profiles.company_name IS '소속 회사명';
COMMENT ON COLUMN public.profiles.company_address IS '회사 주소';
COMMENT ON COLUMN public.profiles.business_type IS '업종/사업 유형';
COMMENT ON COLUMN public.profiles.establishment_date IS '회사 설립일';
COMMENT ON COLUMN public.profiles.employee_count IS '직원 수';
COMMENT ON COLUMN public.profiles.position IS '직책';
COMMENT ON COLUMN public.profiles.department IS '부서';
COMMENT ON COLUMN public.profiles.bio IS '자기소개';
COMMENT ON COLUMN public.profiles.profile_image_url IS '프로필 이미지 URL';
COMMENT ON COLUMN public.profiles.last_login_at IS '마지막 로그인 시간';
COMMENT ON COLUMN public.profiles.login_count IS '총 로그인 횟수';
COMMENT ON COLUMN public.profiles.is_active IS '계정 활성화 상태';
COMMENT ON COLUMN public.profiles.login_attempts IS '로그인 시도 횟수 (잠금 해제용)';
COMMENT ON COLUMN public.profiles.last_failed_login IS '마지막 로그인 실패 시간';

-- 농장 테이블 주석
COMMENT ON TABLE public.farms IS '농장 정보를 저장하는 테이블';
COMMENT ON COLUMN public.farms.id IS '농장 고유 ID';
COMMENT ON COLUMN public.farms.farm_name IS '농장명';
COMMENT ON COLUMN public.farms.description IS '농장 설명';
COMMENT ON COLUMN public.farms.farm_address IS '농장 주소';
COMMENT ON COLUMN public.farms.farm_detailed_address IS '농장 상세주소';
COMMENT ON COLUMN public.farms.farm_type IS '농장 유형 (축산, 농업, 과수원 등)';
COMMENT ON COLUMN public.farms.owner_id IS '농장 소유자 ID (profiles 테이블 참조)';
COMMENT ON COLUMN public.farms.manager_phone IS '농장 관리자 연락처';
COMMENT ON COLUMN public.farms.manager_name IS '농장 관리자명';
COMMENT ON COLUMN public.farms.is_active IS '농장 활성화 상태';

-- 농장 구성원 테이블 주석
COMMENT ON TABLE public.farm_members IS '농장별 구성원 및 권한 정보를 저장하는 테이블';
COMMENT ON COLUMN public.farm_members.id IS '구성원 관계 고유 ID';
COMMENT ON COLUMN public.farm_members.farm_id IS '농장 ID (farms 테이블 참조)';
COMMENT ON COLUMN public.farm_members.user_id IS '사용자 ID (profiles 테이블 참조)';
COMMENT ON COLUMN public.farm_members.role IS '농장 내 역할: owner(소유자), manager(관리자), viewer(조회자)';
COMMENT ON COLUMN public.farm_members.position IS '농장 내 직책';
COMMENT ON COLUMN public.farm_members.responsibilities IS '담당 업무 설명';
COMMENT ON COLUMN public.farm_members.is_active IS '구성원 활성화 상태';

-- 방문자 기록 테이블 주석
COMMENT ON TABLE public.visitor_entries IS '방문자 입장 기록을 저장하는 테이블';
COMMENT ON COLUMN public.visitor_entries.id IS '방문 기록 고유 ID';
COMMENT ON COLUMN public.visitor_entries.farm_id IS '방문한 농장 ID (farms 테이블 참조)';
COMMENT ON COLUMN public.visitor_entries.visit_datetime IS '방문 일시';
COMMENT ON COLUMN public.visitor_entries.visitor_name IS '방문자 성명';
COMMENT ON COLUMN public.visitor_entries.visitor_phone IS '방문자 연락처';
COMMENT ON COLUMN public.visitor_entries.visitor_address IS '방문자 주소';
COMMENT ON COLUMN public.visitor_entries.visitor_purpose IS '방문 목적';
COMMENT ON COLUMN public.visitor_entries.disinfection_check IS '소독 여부 확인';
COMMENT ON COLUMN public.visitor_entries.vehicle_number IS '차량 번호';
COMMENT ON COLUMN public.visitor_entries.notes IS '추가 메모';
COMMENT ON COLUMN public.visitor_entries.registered_by IS '등록한 사용자 ID (profiles 테이블 참조)';
COMMENT ON COLUMN public.visitor_entries.session_token IS '방문자 세션 토큰 (QR코드 생성용)';
COMMENT ON COLUMN public.visitor_entries.consent_given IS '개인정보 수집 동의 여부';
COMMENT ON COLUMN public.visitor_entries.profile_photo_url IS '방문자 프로필 사진 URL';

-- 시스템 로그 테이블 주석
COMMENT ON TABLE public.system_logs IS '시스템 활동 로그를 저장하는 테이블';
COMMENT ON COLUMN public.system_logs.id IS '로그 고유 ID';
COMMENT ON COLUMN public.system_logs.level IS '로그 레벨: error(오류), warn(경고), info(정보), debug(디버그)';
COMMENT ON COLUMN public.system_logs.action IS '수행된 액션 (예: USER_LOGIN, FARM_CREATED)';
COMMENT ON COLUMN public.system_logs.message IS '로그 메시지';
COMMENT ON COLUMN public.system_logs.user_id IS '관련 사용자 ID (profiles 테이블 참조)';
COMMENT ON COLUMN public.system_logs.user_email IS '사용자 이메일 (로그 조회용)';
COMMENT ON COLUMN public.system_logs.user_ip IS '사용자 IP 주소';
COMMENT ON COLUMN public.system_logs.user_agent IS '사용자 브라우저 정보';
COMMENT ON COLUMN public.system_logs.resource_type IS '관련 리소스 유형: farm, user, visitor, system';
COMMENT ON COLUMN public.system_logs.resource_id IS '관련 리소스 ID';
COMMENT ON COLUMN public.system_logs.metadata IS '추가 메타데이터 (JSON 형태)';

-- 시스템 설정 테이블 주석
COMMENT ON TABLE public.system_settings IS '시스템 전역 설정을 저장하는 테이블';
COMMENT ON COLUMN public.system_settings.id IS '설정 고유 ID (항상 "1")';
COMMENT ON COLUMN public.system_settings."siteName" IS '사이트명';
COMMENT ON COLUMN public.system_settings."siteDescription" IS '사이트 설명';
COMMENT ON COLUMN public.system_settings."language" IS '기본 언어 설정';
COMMENT ON COLUMN public.system_settings."timezone" IS '기본 시간대 설정';
COMMENT ON COLUMN public.system_settings."dateFormat" IS '날짜 형식';
COMMENT ON COLUMN public.system_settings."favicon" IS '파비콘 URL';
COMMENT ON COLUMN public.system_settings."logo" IS '로고 URL';
COMMENT ON COLUMN public.system_settings."maxLoginAttempts" IS '최대 로그인 시도 횟수';
COMMENT ON COLUMN public.system_settings."passwordMinLength" IS '비밀번호 최소 길이';
COMMENT ON COLUMN public.system_settings."passwordRequireSpecialChar" IS '비밀번호 특수문자 포함 여부';
COMMENT ON COLUMN public.system_settings."passwordRequireNumber" IS '비밀번호 숫자 포함 여부';
COMMENT ON COLUMN public.system_settings."reVisitAllowInterval" IS '재방문 허용 간격 (시간)';
COMMENT ON COLUMN public.system_settings."maxVisitorsPerDay" IS '일일 최대 방문자 수';
COMMENT ON COLUMN public.system_settings."visitorDataRetentionDays" IS '방문자 데이터 보존 기간 (일)';
COMMENT ON COLUMN public.system_settings."requireVisitorPhoto" IS '방문자 사진 필수 여부';
COMMENT ON COLUMN public.system_settings."requireVisitorContact" IS '방문자 연락처 필수 여부';
COMMENT ON COLUMN public.system_settings."requireVisitPurpose" IS '방문 목적 필수 여부';
COMMENT ON COLUMN public.system_settings."logLevel" IS '로그 레벨 설정';
COMMENT ON COLUMN public.system_settings."logRetentionDays" IS '로그 보존 기간 (일)';
COMMENT ON COLUMN public.system_settings."maintenanceMode" IS '유지보수 모드 활성화 여부';
COMMENT ON COLUMN public.system_settings."debugMode" IS '디버그 모드 활성화 여부';
COMMENT ON COLUMN public.system_settings."maintenanceContactInfo" IS '유지보수 중 연락처 정보';
COMMENT ON COLUMN public.system_settings."maintenanceEstimatedTime" IS '유지보수 예상 시간 (분)';
COMMENT ON COLUMN public.system_settings."maintenanceMessage" IS '유지보수 안내 메시지';
COMMENT ON COLUMN public.system_settings."maintenanceStartTime" IS '유지보수 시작 시간';
COMMENT ON COLUMN public.system_settings."visitTemplate" IS '방문 알림 템플릿';
COMMENT ON COLUMN public.system_settings."vapidPublicKey" IS 'VAPID 공개키 (웹푸시 인증용)';
COMMENT ON COLUMN public.system_settings."vapidPrivateKey" IS 'VAPID 비공개키 (웹푸시 인증용)';
COMMENT ON COLUMN public.system_settings."notificationIcon" IS '푸시 알림 아이콘 URL';
COMMENT ON COLUMN public.system_settings."notificationBadge" IS '푸시 알림 배지 URL';
COMMENT ON COLUMN public.system_settings."pushSoundEnabled" IS '푸시 알림 소리 활성화 여부';
COMMENT ON COLUMN public.system_settings."pushVibrateEnabled" IS '푸시 알림 진동 활성화 여부';
COMMENT ON COLUMN public.system_settings."pushRequireInteraction" IS '푸시 알림 사용자 상호작용 필요 여부';
COMMENT ON COLUMN public.system_settings."subscriptionCleanupDays" IS '구독 정리 삭제 일수 (soft delete 후 완전 삭제까지)';
COMMENT ON COLUMN public.system_settings."subscriptionFailCountThreshold" IS '구독 비활성화 실패 횟수 임계값';
COMMENT ON COLUMN public.system_settings."subscriptionCleanupInactive" IS '비활성 구독 자동 정리 여부';
COMMENT ON COLUMN public.system_settings."subscriptionForceDelete" IS '구독 강제 삭제 여부 (soft delete 대신)';

-- 푸시 구독 테이블 주석
COMMENT ON TABLE public.push_subscriptions IS '웹푸시 구독 정보를 저장하는 테이블';
COMMENT ON COLUMN public.push_subscriptions.user_id IS '구독한 사용자 ID';
COMMENT ON COLUMN public.push_subscriptions.endpoint IS '푸시 서비스 엔드포인트 URL';
COMMENT ON COLUMN public.push_subscriptions.p256dh IS '공개키 (P-256 ECDH)';
COMMENT ON COLUMN public.push_subscriptions.auth IS '인증 비밀키';
COMMENT ON COLUMN public.push_subscriptions.created_at IS '구독 생성 시간';
COMMENT ON COLUMN public.push_subscriptions.updated_at IS '구독 정보 수정 시간';
COMMENT ON COLUMN public.push_subscriptions.deleted_at IS '구독 삭제 시간 (soft delete)';
COMMENT ON COLUMN public.push_subscriptions.device_id IS '디바이스 식별자';
COMMENT ON COLUMN public.push_subscriptions.fail_count IS '푸시 발송 실패 횟수';
COMMENT ON COLUMN public.push_subscriptions.is_active IS '구독 활성화 상태';
COMMENT ON COLUMN public.push_subscriptions.last_fail_at IS '마지막 실패 시간';
COMMENT ON COLUMN public.push_subscriptions.last_used_at IS '마지막 사용 시간';
COMMENT ON COLUMN public.push_subscriptions.user_agent IS '사용자 브라우저 정보';

-- user_notification_settings 테이블 주석
COMMENT ON TABLE public.user_notification_settings IS '사용자별 알림 설정을 저장하는 테이블';
COMMENT ON COLUMN public.user_notification_settings.id IS '알림 설정 고유 ID';
COMMENT ON COLUMN public.user_notification_settings.user_id IS '사용자 ID (auth.users 테이블 참조)';
COMMENT ON COLUMN public.user_notification_settings.notification_method IS '알림 방법: push, kakao';
COMMENT ON COLUMN public.user_notification_settings.visitor_alerts IS '방문자 알림 활성화 여부';
COMMENT ON COLUMN public.user_notification_settings.notice_alerts IS '공지사항 알림 활성화 여부';
COMMENT ON COLUMN public.user_notification_settings.emergency_alerts IS '긴급 알림 활성화 여부';
COMMENT ON COLUMN public.user_notification_settings.maintenance_alerts IS '시스템 알림 활성화 여부';
COMMENT ON COLUMN public.user_notification_settings.kakao_user_id IS '카카오톡 사용자 ID';
COMMENT ON COLUMN public.user_notification_settings.is_active IS '알림 설정 활성화 상태';
COMMENT ON COLUMN public.user_notification_settings.created_at IS '생성 시간';
COMMENT ON COLUMN public.user_notification_settings.updated_at IS '수정 시간';




