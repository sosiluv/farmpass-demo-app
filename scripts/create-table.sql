-- 데이터베이스 완전 재구축 스크립트
-- 2024-12-14: 개선된 Role 시스템 적용
-- 2024-12-14: RLS 무한 재귀 문제 해결 (순환 참조 제거)



-- ============================================
-- 2단계: 새로운 테이블 생성
-- ============================================

-- 데이터베이스 시간대 설정을 한국 시간(KST)으로 변경
ALTER DATABASE postgres SET timezone TO 'Asia/Seoul';

-- 현재 세션의 시간대를 한국 시간으로 설정
SET timezone = 'Asia/Seoul';

-- 로그 레벨 enum 생성
CREATE TYPE "public"."LogLevel" AS ENUM ('error', 'warn', 'info', 'debug');

-- 2.1 사용자 프로필 테이블 (개선된 구조)
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL DEFAULT '',
    phone TEXT,
    
    -- 시스템 레벨 권한 (단순화)
    account_type TEXT NOT NULL DEFAULT 'user' CHECK (account_type IN ('admin', 'user')),
    
    -- 회사/개인 정보
    company_name TEXT,
    company_address TEXT,
    business_type TEXT,
    company_description TEXT,
    establishment_date DATE,
    employee_count INTEGER,
    company_website TEXT,
    
    -- 개인 정보
    position TEXT,
    department TEXT,
    bio TEXT,
    profile_image_url TEXT,
    
    -- 시스템 정보
    last_login_at TIMESTAMPTZ WITH TIME ZONE,
    password_changed_at TIMESTAMPTZ WITH TIME ZONE,
    login_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    login_attempts INTEGER DEFAULT 0 NOT NULL,
    last_login_attempt TIMESTAMPTZ WITH TIME ZONE,
    last_failed_login TIMESTAMPTZ WITH TIME ZONE null,
    
    -- 타임스탬프
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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

-- 2.2 농장 테이블
CREATE TABLE public.farms (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    farm_name TEXT NOT NULL,
    description TEXT,
    
    -- 주소 정보
    farm_address TEXT NOT NULL,
    farm_detailed_address TEXT,
    
    -- 농장 정보
    farm_type TEXT, -- 농장 유형 (축산, 농업 등)
    
    -- 소유자 정보
    owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    
    -- 연락처 정보
    manager_phone TEXT,
    manager_name TEXT,
    
    -- 상태 정보
    is_active BOOLEAN DEFAULT true,
    
    -- 타임스탬프
    created_at TIMESTAMPTZ WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMPTZ WITH TIME ZONE DEFAULT NOW()
);

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

-- 2.3 농장 구성원 테이블 (농장별 권한 관리)
CREATE TABLE public.farm_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

    -- 농장 내 역할 (농장별 권한)
    role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('owner', 'manager', 'viewer')),

    -- 구성원 정보
    position TEXT, -- 직책
    responsibilities TEXT, -- 담당 업무

    -- 상태 정보
    is_active BOOLEAN DEFAULT true,

    -- 타임스탬프
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- 유니크 제약조건 (한 사용자는 한 농장에 한 번만 속할 수 있음)
    UNIQUE(farm_id, user_id)
);

-- 농장 구성원 테이블 주석
COMMENT ON TABLE public.farm_members IS '농장별 구성원 및 권한 정보를 저장하는 테이블';
COMMENT ON COLUMN public.farm_members.id IS '구성원 관계 고유 ID';
COMMENT ON COLUMN public.farm_members.farm_id IS '농장 ID (farms 테이블 참조)';
COMMENT ON COLUMN public.farm_members.user_id IS '사용자 ID (profiles 테이블 참조)';
COMMENT ON COLUMN public.farm_members.role IS '농장 내 역할: owner(소유자), manager(관리자), viewer(조회자)';
COMMENT ON COLUMN public.farm_members.position IS '농장 내 직책';
COMMENT ON COLUMN public.farm_members.responsibilities IS '담당 업무 설명';
COMMENT ON COLUMN public.farm_members.is_active IS '구성원 활성화 상태';

-- 2.4 방문자 기록 테이블
CREATE TABLE public.visitor_entries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
    
    -- 방문일시
    visit_datetime TIMESTAMP WITH TIME ZONE NOT NULL,

    -- 방문자 정보
    visitor_name TEXT NOT NULL,
    visitor_phone TEXT NOT NULL,
    visitor_address TEXT NOT NULL,
    visitor_purpose TEXT,
    
    -- 소독 여부    
    disinfection_check BOOLEAN DEFAULT false,

    -- 차량 정보
    vehicle_number TEXT,
    
    -- 추가 정보
    notes TEXT,
    
    -- 등록자 정보
    registered_by UUID REFERENCES public.profiles(id),

    -- 세션 토큰
    session_token TEXT NOT NULL DEFAULT gen_random_uuid()::text,

    -- 개인정보 동의
    consent_given BOOLEAN DEFAULT false,

    -- 프로필 사진
    profile_photo_url TEXT,

    -- 타임스탬프
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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

-- 2.5 시스템 로그 테이블
CREATE TABLE public.system_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- 로그 기본 정보
    level "LogLevel" NOT NULL DEFAULT 'info',
    action TEXT NOT NULL,
    message TEXT NOT NULL,
    
    -- 사용자 정보
    user_id UUID REFERENCES public.profiles(id),
    user_email TEXT,
    user_ip TEXT,
    user_agent TEXT,
     
    -- 관련 리소스 정보
    resource_type TEXT, -- 'farm', 'user', 'visitor', 'system'
    resource_id UUID,
    
    -- 추가 데이터 (JSON)
    metadata JSONB,
    
    -- 타임스탬프
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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

-- 시스템 설정 테이블 생성
CREATE TABLE "public"."system_settings" (
  "id" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  
  -- 일반 설정
  "siteName" TEXT NOT NULL DEFAULT '농장 출입 관리 시스템(FarmPass)',
  "siteDescription" TEXT NOT NULL DEFAULT '방역은 출입자 관리부터 시작됩니다. QR기록으로 축산 질병 예방의 첫걸음을 함께하세요.',
  "language" TEXT NOT NULL DEFAULT 'ko',
  "timezone" TEXT NOT NULL DEFAULT 'Asia/Seoul',
  "dateFormat" TEXT NOT NULL DEFAULT 'YYYY-MM-DD',
  "favicon" TEXT,
  "logo" TEXT,
  
  -- 보안 설정
  "maxLoginAttempts" INTEGER NOT NULL DEFAULT 5,
  "passwordMinLength" INTEGER NOT NULL DEFAULT 8,
  "passwordRequireSpecialChar" BOOLEAN NOT NULL DEFAULT true,
  "passwordRequireNumber" BOOLEAN NOT NULL DEFAULT true,
  
  -- 방문자 정책
  "reVisitAllowInterval" INTEGER NOT NULL DEFAULT 6,
  "maxVisitorsPerDay" INTEGER NOT NULL DEFAULT 100,
  "visitorDataRetentionDays" INTEGER NOT NULL DEFAULT 1095,
  "requireVisitorPhoto" BOOLEAN NOT NULL DEFAULT false,
  "requireVisitorContact" BOOLEAN NOT NULL DEFAULT true,
  "requireVisitPurpose" BOOLEAN NOT NULL DEFAULT true,
  
  -- 알림 설정
  "visitTemplate" TEXT NOT NULL DEFAULT '{방문자명}님이 {방문날짜} {방문시간}에 {농장명}을 방문하였습니다.',
  
  -- 시스템 설정
  "logLevel" "LogLevel" NOT NULL DEFAULT 'info',
  "logRetentionDays" INTEGER NOT NULL DEFAULT 90,
  "maintenanceMode" BOOLEAN NOT NULL DEFAULT false,
  "debugMode" BOOLEAN NOT NULL DEFAULT false,
  "passwordRequireUpperCase" BOOLEAN NOT NULL DEFAULT true,
  "passwordRequireLowerCase" BOOLEAN NOT NULL DEFAULT true,
  "maintenanceContactInfo" TEXT NOT NULL default '문의사항이 있으시면 관리자에게 연락해 주세요.'::text,
  "maintenanceEstimatedTime" integer NOT NULL default 30,
  "maintenanceMessage" TEXT NOT NULL default '현재 시스템 업데이트 및 유지보수 작업이 진행 중입니다.'::text,
  "maintenanceStartTime" TIMESTAMP WITH TIME ZONE NULL,
  "accountLockoutDurationMinutes" INTEGER NOT NULL DEFAULT 15,

  -- 푸시 알림 설정
  "notificationBadge" TEXT,
  "notificationIcon" TEXT,
  "pushRequireInteraction" BOOLEAN NOT NULL DEFAULT false,
  "pushSoundEnabled" BOOLEAN NOT NULL DEFAULT false,
  "pushVibrateEnabled" BOOLEAN NOT NULL DEFAULT false,
  "vapidPrivateKey" TEXT,
  "vapidPublicKey" TEXT,

  CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id")
);

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

-- 푸시 구독 정보 테이블
CREATE TABLE public.push_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  farm_id UUID REFERENCES farms(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT,
  auth TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- 중복 구독 방지를 위한 유니크 제약
  UNIQUE(user_id, farm_id, endpoint)
);

-- 기존 푸시 구독 테이블 주석 유지
COMMENT ON TABLE public.push_subscriptions IS '웹푸시 구독 정보를 저장하는 테이블';
COMMENT ON COLUMN public.push_subscriptions.user_id IS '구독한 사용자 ID';
COMMENT ON COLUMN public.push_subscriptions.farm_id IS '구독한 농장 ID (NULL이면 전체 구독)';
COMMENT ON COLUMN public.push_subscriptions.endpoint IS '푸시 서비스 엔드포인트 URL';
COMMENT ON COLUMN public.push_subscriptions.p256dh IS '공개키 (P-256 ECDH)';
COMMENT ON COLUMN public.push_subscriptions.auth IS '인증 비밀키';
COMMENT ON COLUMN public.push_subscriptions.created_at IS '구독 생성 시간';
COMMENT ON COLUMN public.push_subscriptions.updated_at IS '구독 정보 수정 시간';


-----------------------------------------------------------------------------------------------------------------------------

CREATE TABLE user_notification_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    notification_method VARCHAR(20) NOT NULL, -- 'push' 또는 'kakao'
    visitor_alerts BOOLEAN DEFAULT true,      -- 방문자 알림
    emergency_alerts BOOLEAN DEFAULT true,    -- 긴급 알림
    maintenance_alerts BOOLEAN DEFAULT true,  -- 시스템 알림
    kakao_user_id VARCHAR(100),              -- 카카오톡 사용 시 필요한 정보
    is_active BOOLEAN DEFAULT false,         -- 기본적으로 알림 비활성화
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    notice_alerts BOOLEAN DEFAULT true,      -- 공지사항 알림
    UNIQUE(user_id)
);

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





-- ============================================
-- 3단계: 인덱스 생성
-- ============================================

-- profiles 테이블 인덱스
CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_profiles_account_type ON public.profiles(account_type);
CREATE INDEX idx_profiles_created_at ON public.profiles(created_at);

-- farms 테이블 인덱스
CREATE INDEX idx_farms_owner_id ON public.farms(owner_id);
CREATE INDEX idx_farms_created_at ON public.farms(created_at);
CREATE INDEX idx_farms_is_active ON public.farms(is_active);

-- farm_members 테이블 인덱스
CREATE INDEX idx_farm_members_farm_id ON public.farm_members(farm_id);
CREATE INDEX idx_farm_members_user_id ON public.farm_members(user_id);
CREATE INDEX idx_farm_members_role ON public.farm_members(role);

-- visitor_entries 테이블 인덱스
CREATE INDEX idx_visitor_entries_farm_id ON public.visitor_entries(farm_id);
CREATE INDEX idx_visitor_entries_visit_datetime ON public.visitor_entries(visit_datetime);
CREATE INDEX idx_visitor_entries_visitor_phone ON public.visitor_entries(visitor_phone);
CREATE INDEX idx_visitor_entries_created_at ON public.visitor_entries(created_at);

-- system_logs 테이블 인덱스
CREATE INDEX idx_system_logs_user_id ON public.system_logs(user_id);
CREATE INDEX idx_system_logs_level ON public.system_logs(level);
CREATE INDEX idx_system_logs_action ON public.system_logs(action);
CREATE INDEX idx_system_logs_resource_type ON public.system_logs(resource_type);
CREATE INDEX idx_system_logs_created_at ON public.system_logs(created_at);

-- push_subscriptions 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_farm_id ON push_subscriptions(farm_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_endpoint ON push_subscriptions(endpoint);

-- user_notification_settings 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_user_notification_settings_user_id ON user_notification_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_user_notification_settings_notification_method ON user_notification_settings(notification_method);


-- ============================================
-- 4단계: RLS (Row Level Security) 설정
-- ============================================

-- RLS 활성화
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farm_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visitor_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_notification_settings ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 10단계: 권한 부여
-- ============================================

-- 인증된 사용자에게 테이블 접근 권한 부여
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- 익명 사용자에게 제한적 권한 부여 (필요한 경우)
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT ON public.profiles TO anon;

-- service_role 유저에게 public 스키마 사용 권한 부여
GRANT USAGE ON SCHEMA public TO service_role;

-- service_role 유저에게 system_logs 테이블에 대한 모든 권한 부여
GRANT INSERT, SELECT, UPDATE, DELETE ON TABLE public.system_logs TO service_role;

-- ============================================
-- 11단계: 확인 쿼리들
-- ============================================

-- 테이블 생성 확인
SELECT
    schemaname,
    tablename,
    tableowner,
    hasindexes,
    hasrules,
    hastriggers
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- 함수 생성 확인
SELECT
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name LIKE '%farm%' OR routine_name LIKE '%user%'
ORDER BY routine_name;

-- RLS 정책 확인
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

------------------------------------------------------------------------------------------------------------------------------------------------



