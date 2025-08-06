-- 새 사용자 프로필 생성 함수 (성공/실패 로그 통합)
-- Recreate the function with comprehensive logging
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (
        id,
        email,
        name,
        phone,
        account_type,
        profile_image_url
    )
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', ''),
        COALESCE(NEW.raw_user_meta_data->>'phone', ''),
        'user',
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public; 

-- 7.2 새 사용자 트리거 생성
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

----------------------------------------------------------------------------------------------------------------------

-- 비밀번호 변경 관련 통합 트리거 함수 (성공/실패 로그 통합)
CREATE OR REPLACE FUNCTION public.handle_password_change()
RETURNS TRIGGER AS $$
DECLARE
    v_error_message TEXT;
BEGIN
  -- 비밀번호가 변경된 경우에만 처리
  IF OLD.encrypted_password IS DISTINCT FROM NEW.encrypted_password THEN
    BEGIN
        -- 프로필 테이블 업데이트 시도
    UPDATE public.profiles
    SET
        password_changed_at = NOW(),
        updated_at = NOW()
    WHERE id = NEW.id;

        -- 성공 시 로그 기록 (system-log.ts 양식에 맞춤)
    INSERT INTO public.system_logs (
      level,
      action,
      message,
      user_id,
      user_email,
      user_ip,
      user_agent,
      resource_type,
      resource_id,
      metadata
    ) VALUES (
        'info',
        'PASSWORD_CHANGED',
        '비밀번호가 변경되었습니다: ' || NEW.email,
        NEW.id,
        NEW.email,
        'server',
        'Database Trigger',
        'auth',
        NEW.id,
        jsonb_build_object(
        'changed_at', NOW()::text,
        'changed_by', COALESCE(auth.uid()::text, 'system'),
        'timestamp', NOW()::text,
        'trigger_source', 'handle_password_change',
        'action_type', 'authentication',
        'status', 'success'
          )
        );

    EXCEPTION WHEN OTHERS THEN
        -- 에러 정보 수집
        GET STACKED DIAGNOSTICS v_error_message = MESSAGE_TEXT;
        
        -- 실패 시 로그 기록
        INSERT INTO public.system_logs (
          level,
          action,
          message,
          user_id,
          user_email,
          user_ip,
          user_agent,
          resource_type,
          resource_id,
          metadata
        ) VALUES (
          'error',
          'PASSWORD_CHANGE_FAILED',
          '비밀번호 변경 실패: ' || NEW.email || ' - ' || v_error_message,
      NEW.id,
      NEW.email,
          'server',
          'Database Trigger',
          'auth',
      NEW.id,
      jsonb_build_object(
            'changed_at', NOW()::text,
            'changed_by', COALESCE(auth.uid()::text, 'system'),
            'error_message', v_error_message,
            'error_code', SQLSTATE,
            'timestamp', NOW()::text,
            'trigger_source', 'handle_password_change',
            'action_type', 'authentication',
            'status', 'failed'
      )
    );

        -- 에러를 다시 발생시켜 상위 트랜잭션에서 처리하도록 함
        RAISE;
    END;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 새로운 트리거 생성
DROP TRIGGER IF EXISTS tr_handle_password_change ON auth.users;
CREATE TRIGGER tr_handle_password_change
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_password_change();

-----------------------------------------------------------------------------------------------------------------------


-- 로그아웃 이벤트 처리 함수 (세션 테이블 모니터링)
-- 참고: Supabase는 기본적으로 로그아웃 이벤트를 직접 트리거로 처리하기 어려움
-- 대신 세션 테이블의 변경을 모니터링하거나, 클라이언트에서 별도 API 호출을 권장

-- 세션 만료/삭제 이벤트 처리 함수
CREATE OR REPLACE FUNCTION public.handle_session_event()
RETURNS TRIGGER AS $$
DECLARE
    v_error_message TEXT;
    v_user_email TEXT;
BEGIN
    -- 세션이 삭제된 경우 (로그아웃 또는 만료)
    IF TG_OP = 'DELETE' THEN
        BEGIN
            -- 사용자 이메일 조회
            SELECT email INTO v_user_email 
            FROM auth.users 
            WHERE id = OLD.user_id;
            
            -- 성공 시 로그 기록
            INSERT INTO public.system_logs (
                level,
                action,
                message,
                user_id,
                user_email,
                user_ip,
                user_agent,
                resource_type,
                resource_id,
                metadata
            ) VALUES (
                'info',
                'LOGOUT_SUCCESS',
                '사용자가 로그아웃했습니다: ' || COALESCE(v_user_email, 'unknown'),
                OLD.user_id,
                COALESCE(v_user_email, 'unknown'),
                'server',
                'Database Trigger',
                'auth',
                OLD.user_id,
                jsonb_build_object(
                    'session_id', OLD.id::text,
                    'logout_at', NOW()::text,
                    'session_created_at', OLD.created_at::text,
                    'session_not_after', OLD.not_after::text,
                    'timestamp', NOW()::text,
                    'trigger_source', 'handle_session_event',
                    'action_type', 'authentication',
                    'status', 'success'
                )
            );

        EXCEPTION WHEN OTHERS THEN
            -- 에러 정보 수집
            GET STACKED DIAGNOSTICS v_error_message = MESSAGE_TEXT;
            
            -- 실패 시 로그 기록
            INSERT INTO public.system_logs (
                level,
                action,
                message,
                user_id,
                user_email,
                user_ip,
                user_agent,
                resource_type,
                resource_id,
                metadata
            ) VALUES (
                'error',
                'LOGOUT_FAILED',
                '로그아웃 로그 기록 실패: ' || COALESCE(v_user_email, 'unknown') || ' - ' || v_error_message,
                OLD.user_id,
                COALESCE(v_user_email, 'unknown'),
                'server',
                'Database Trigger',
                'auth',
                OLD.user_id,
                jsonb_build_object(
                    'session_id', OLD.id::text,
                    'error_message', v_error_message,
                    'error_code', SQLSTATE,
                    'timestamp', NOW()::text,
                    'trigger_source', 'handle_session_event',
                    'action_type', 'authentication',
                    'status', 'failed'
                )
            );

            -- 에러를 다시 발생시켜 상위 트랜잭션에서 처리하도록 함
            RAISE;
        END;
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 세션 이벤트 트리거 생성 (로그아웃 감지)
DROP TRIGGER IF EXISTS tr_handle_session_event ON auth.sessions;
CREATE TRIGGER tr_handle_session_event
    AFTER DELETE ON auth.sessions
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_session_event();

-----------------------------------------------------------------------------------------------------------------------

-- CREATE OR REPLACE FUNCTION public.handle_profile_delete_on_user_delete()
-- RETURNS TRIGGER AS $$
-- BEGIN
--   DELETE FROM public.profiles WHERE id = OLD.id;
--   RETURN OLD;
-- END;
-- $$ LANGUAGE plpgsql SECURITY DEFINER;

-- DROP TRIGGER IF EXISTS tr_handle_profile_delete_on_user_delete ON auth.users;
-- CREATE TRIGGER tr_handle_profile_delete_on_user_delete
--   AFTER DELETE ON auth.users
--   FOR EACH ROW
--   EXECUTE FUNCTION public.handle_profile_delete_on_user_delete();



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
COMMENT ON COLUMN public.profiles.company_description IS '회사 설명';
COMMENT ON COLUMN public.profiles.company_website IS '회사 웹사이트';
COMMENT ON COLUMN public.profiles.avatar_seed IS '아바타 생성용 seed (Dicebear)';
COMMENT ON COLUMN public.profiles.password_changed_at IS '비밀번호 변경 시간';
COMMENT ON COLUMN public.profiles.last_login_attempt IS '마지막 로그인 시도 시간';
COMMENT ON COLUMN public.profiles.created_at IS '생성 시간';
COMMENT ON COLUMN public.profiles.updated_at IS '수정 시간';


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
COMMENT ON COLUMN public.farms.created_at IS '생성 시간';
COMMENT ON COLUMN public.farms.updated_at IS '수정 시간';

-- 농장 구성원 테이블 주석
COMMENT ON TABLE public.farm_members IS '농장별 구성원 및 권한 정보를 저장하는 테이블';
COMMENT ON COLUMN public.farm_members.id IS '구성원 관계 고유 ID';
COMMENT ON COLUMN public.farm_members.farm_id IS '농장 ID (farms 테이블 참조)';
COMMENT ON COLUMN public.farm_members.user_id IS '사용자 ID (profiles 테이블 참조)';
COMMENT ON COLUMN public.farm_members.role IS '농장 내 역할: owner(소유자), manager(관리자), viewer(조회자)';
COMMENT ON COLUMN public.farm_members.position IS '농장 내 직책';
COMMENT ON COLUMN public.farm_members.responsibilities IS '담당 업무 설명';
COMMENT ON COLUMN public.farm_members.is_active IS '구성원 활성화 상태';
COMMENT ON COLUMN public.farm_members.created_at IS '생성 시간';
COMMENT ON COLUMN public.farm_members.updated_at IS '수정 시간';


-- 방문자 기록 테이블 주석
COMMENT ON TABLE public.visitor_entries IS '방문자 입장 기록을 저장하는 테이블';
COMMENT ON COLUMN public.visitor_entries.id IS '방문 기록 고유 ID';
COMMENT ON COLUMN public.visitor_entries.farm_id IS '방문한 농장 ID (farms 테이블 참조)';
COMMENT ON COLUMN public.visitor_entries.visit_datetime IS '방문 일시';
COMMENT ON COLUMN public.visitor_entries.visitor_name IS '방문자 이름';
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
COMMENT ON COLUMN public.visitor_entries.created_at IS '생성 시간';
COMMENT ON COLUMN public.visitor_entries.updated_at IS '수정 시간';

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
COMMENT ON COLUMN public.system_logs.created_at IS '생성 시간';

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


-- 기존 푸시 구독 테이블 주석 유지
COMMENT ON TABLE public.push_subscriptions IS '웹푸시 구독 정보를 저장하는 테이블';
COMMENT ON COLUMN public.push_subscriptions.user_id IS '구독한 사용자 ID';
COMMENT ON COLUMN public.push_subscriptions.endpoint IS '푸시 서비스 엔드포인트 URL';
COMMENT ON COLUMN public.push_subscriptions.p256dh IS '공개키 (P-256 ECDH)';
COMMENT ON COLUMN public.push_subscriptions.auth IS '인증 비밀키';
COMMENT ON COLUMN public.push_subscriptions.created_at IS '구독 생성 시간';
COMMENT ON COLUMN public.push_subscriptions.updated_at IS '구독 정보 수정 시간';
COMMENT ON COLUMN public.push_subscriptions.id IS '구독 고유 ID';
COMMENT ON COLUMN public.push_subscriptions.deleted_at IS '구독 삭제 시간 (soft delete)';
COMMENT ON COLUMN public.push_subscriptions.device_id IS '디바이스 식별자';
COMMENT ON COLUMN public.push_subscriptions.is_active IS '구독 활성화 상태';
COMMENT ON COLUMN public.push_subscriptions.fail_count IS '푸시 발송 실패 횟수';
COMMENT ON COLUMN public.push_subscriptions.last_fail_at IS '마지막 실패 시간';
COMMENT ON COLUMN public.push_subscriptions.last_used_at IS '마지막 사용 시간';


-- user_notification_settings 테이블 주석
COMMENT ON TABLE public.user_notification_settings IS '사용자별 알림 설정을 저장하는 테이블';
COMMENT ON COLUMN public.user_notification_settings.id IS '알림 설정 고유 ID';
COMMENT ON COLUMN public.user_notification_settings.user_id IS '사용자 ID (auth.users 테이블 참조)';
COMMENT ON COLUMN public.user_notification_settings.notification_method IS '알림 방법: push, kakao';
COMMENT ON COLUMN public.user_notification_settings.visitor_alerts IS '방문자 알림 활성화 여부';
COMMENT ON COLUMN public.user_notification_settings.system_alerts IS '시스템 알림 활성화 여부';
COMMENT ON COLUMN public.user_notification_settings.kakao_user_id IS '카카오톡 사용자 ID';
COMMENT ON COLUMN public.user_notification_settings.is_active IS '알림 설정 활성화 상태';
COMMENT ON COLUMN public.user_notification_settings.created_at IS '생성 시간';
COMMENT ON COLUMN public.user_notification_settings.updated_at IS '수정 시간';


-- 알림 테이블 주석
COMMENT ON TABLE public.notifications IS '시스템 알림(이벤트, 권한, 방문 등)을 저장하는 테이블';
COMMENT ON COLUMN public.notifications.id IS '알림 고유 ID';
COMMENT ON COLUMN public.notifications.user_id IS '알림을 받을 사용자 ID (profiles.id)';
COMMENT ON COLUMN public.notifications.type IS '알림 유형(예: farm_member_added, visitor_registered 등)';
COMMENT ON COLUMN public.notifications.title IS '알림 제목';
COMMENT ON COLUMN public.notifications.message IS '알림 본문/내용';
COMMENT ON COLUMN public.notifications.data IS '추가 데이터(관련 리소스 ID 등, JSON)';
COMMENT ON COLUMN public.notifications.read IS '읽음 여부';
COMMENT ON COLUMN public.notifications.created_at IS '생성 시각';
COMMENT ON COLUMN public.notifications.updated_at IS '수정 시각(읽음 처리 등)';


