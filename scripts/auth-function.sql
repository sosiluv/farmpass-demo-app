-- 새 사용자 프로필 생성 함수 (성공/실패 로그 통합)
-- Recreate the function with comprehensive logging
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    v_profile_id UUID;
    v_error_message TEXT;
BEGIN
    BEGIN
        -- 프로필 생성 시도
    INSERT INTO public.profiles (
        id,
        email,
        name,
        phone,
        account_type
    )
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', ''),
        COALESCE(NEW.raw_user_meta_data->>'phone', ''),
        'user'
    )
    RETURNING id INTO v_profile_id;



    RETURN NEW;

    EXCEPTION WHEN OTHERS THEN
        -- 에러 정보 수집
        GET STACKED DIAGNOSTICS v_error_message = MESSAGE_TEXT;
        

        RAISE;
    END;
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
