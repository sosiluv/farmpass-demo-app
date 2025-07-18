-- 농장 테이블 더미 데이터 생성 스크립트
-- 테이블 스키마 참조: farms 테이블
-- 다양한 농장 유형과 지역별 데이터 포함

-- ============================================
-- 1단계: 더미 사용자 프로필 생성 (농장 소유자용)
-- ============================================

-- 더미 사용자 생성 (이미 존재하는 경우 무시)
DO $$
DECLARE
    dummy_user_ids UUID[] := ARRAY[
        'a45d5a0f-4f1b-4815-9574-9971e17901fd',
        'b56e6b1f-5f2c-5926-a685-a082f28a02fe',
        'c67f7c2f-6f3d-6037-b796-b193f39b03ff',
        'd78g8d3f-7f4e-7148-c8a7-c2a4f4ac04aa',
        'e89h9e4f-8f5f-8259-d9b8-d3b5f5bd05bb',
        'f90i0f5f-9f6g-9360-eac9-e4c6f6ce06cc'
    ];
    dummy_user_id UUID;
    user_counter INTEGER := 1;
BEGIN
    FOREACH dummy_user_id IN ARRAY dummy_user_ids
    LOOP
        -- profiles 테이블에 더미 사용자 삽입 (이미 존재하면 무시)
        INSERT INTO public.profiles (
            id, 
            email, 
            name, 
            phone, 
            account_type,
            company_name,
            position,
            is_active,
            created_at,
            updated_at
        ) VALUES (
            dummy_user_id,
            'farmowner' || user_counter || '@example.com',
            CASE user_counter
                WHEN 1 THEN '김농장'
                WHEN 2 THEN '이축산'  
                WHEN 3 THEN '박재배'
                WHEN 4 THEN '최유기'
                WHEN 5 THEN '정친환'
                WHEN 6 THEN '한스마트'
                ELSE '농장주' || user_counter
            END,
            '010-' || LPAD((1000 + user_counter)::text, 4, '0') || '-' || LPAD((5000 + user_counter)::text, 4, '0'),
            'user',
            CASE user_counter
                WHEN 1 THEN '김농장영농조합법인'
                WHEN 2 THEN '이축산농장'
                WHEN 3 THEN '박재배농업회사법인'
                WHEN 4 THEN '최유기농장'
                WHEN 5 THEN '정친환농업'
                WHEN 6 THEN '한스마트팜'
                ELSE '농장회사' || user_counter
            END,
            '대표',
            true,
            NOW() - INTERVAL '1 year',
            NOW() - INTERVAL '1 month'
        ) ON CONFLICT (id) DO NOTHING;
        
        user_counter := user_counter + 1;
    END LOOP;
END $$;

-- ============================================
-- 2단계: 농장 더미 데이터 삽입
-- ============================================

-- 더미 농장 데이터 (다양한 농장 유형과 지역)
INSERT INTO public.farms (
    id,
    farm_name,
    description,
    farm_address,
    farm_detailed_address,
    farm_type,
    owner_id,
    manager_phone,
    manager_name,
    is_active,
    created_at,
    updated_at
) VALUES
-- 축산농장 (소, 돼지, 닭 등)
(
    gen_random_uuid(),
    '청정한우농장',
    '100% 국내산 한우를 키우는 친환경 농장입니다. HACCP 인증을 받았으며 청정 지역에서 사육하고 있습니다.',
    '경기도 이천시 부발읍 산업단지로 123',
    '농장동 A동 1호',
    '축산업(한우)',
    'a45d5a0f-4f1b-4815-9574-9971e17901fd',
    '010-1234-5678',
    '김철수',
    true,
    NOW() - INTERVAL '6 months',
    NOW() - INTERVAL '1 month'
),
(
    gen_random_uuid(),
    '행복양돈농장',
    '위생적이고 현대적인 시설을 갖춘 양돈 전문 농장입니다. 동물복지 인증을 받았습니다.',
    '충청남도 천안시 동남구 병천면 가전리 456',
    '농장관리동 2층',
    '축산업(돼지)',
    'b56e6b1f-5f2c-5926-a685-a082f28a02fe',
    '010-2345-6789',
    '이영희',
    true,
    NOW() - INTERVAL '1 year',
    NOW() - INTERVAL '2 weeks'
),
(
    gen_random_uuid(),
    '신선계란농장',
    '자연 방사 사육으로 건강한 닭과 신선한 계란을 생산하는 농장입니다.',
    '전라북도 정읍시 칠보면 시산리 789',
    '계사동 1~5동',
    '축산업(닭)',
    'c67f7c2f-6f3d-6037-b796-b193f39b03ff',
    '010-3456-7890',
    '박민수',
    true,
    NOW() - INTERVAL '8 months',
    NOW() - INTERVAL '5 days'
),

-- 농업 (채소, 과일, 곡물)
(
    gen_random_uuid(),
    '푸른들 채소농장',
    '무농약 인증을 받은 친환경 채소 전문 농장입니다. 상추, 배추, 무 등을 재배합니다.',
    '강원도 홍천군 홍천읍 희망리 321',
    '비닐하우스 1~10동',
    '농업(채소)',
    'd78g8d3f-7f4e-7148-c8a7-c2a4f4ac04aa',
    '010-4567-8901',
    '최정호',
    true,
    NOW() - INTERVAL '2 years',
    NOW() - INTERVAL '3 days'
),
(
    gen_random_uuid(),
    '달콤한 딸기농장',
    '최고 품질의 딸기를 재배하는 스마트팜입니다. 관광농장도 운영하고 있습니다.',
    '경상남도 진주시 금곡면 월아산로 654',
    '스마트팜 A동~D동',
    '농업(과일)',
    'e89h9e4f-8f5f-8259-d9b8-d3b5f5bd05bb',
    '010-5678-9012',
    '정수진',
    true,
    NOW() - INTERVAL '1 year 3 months',
    NOW() - INTERVAL '1 week'
),
(
    gen_random_uuid(),
    '황금들녘 쌀농장',
    '친환경 쌀 재배 전문 농장입니다. GAP 인증을 받은 고품질 쌀을 생산합니다.',
    '전라남도 나주시 다시면 운곡리 987',
    '농기계 보관소, 건조시설 포함',
    '농업(곡물)',
    'f90i0f5f-9f6g-9360-eac9-e4c6f6ce06cc',
    '010-6789-0123',
    '한동철',
    true,
    NOW() - INTERVAL '15 months',
    NOW() - INTERVAL '10 days'
),

-- 과수원
(
    gen_random_uuid(),
    '청송사과농장',
    '고품질 사과를 재배하는 전통 과수원입니다. 직판장도 운영하고 있습니다.',
    '경상북도 청송군 청송읍 중평리 147',
    '과수원 1구역~5구역',
    '과수업(사과)',
    'a45d5a0f-4f1b-4815-9574-9971e17901fd',
    '010-7890-1234',
    '배순희',
    true,
    NOW() - INTERVAL '3 years',
    NOW() - INTERVAL '2 weeks'
),
(
    gen_random_uuid(),
    '제주감귤농장',
    '제주 특산품인 감귤을 재배하는 농장입니다. 온라인 직판도 활발히 하고 있습니다.',
    '제주특별자치도 서귀포시 남원읍 하례리 258',
    '감귤원 A구역~F구역, 저장고',
    '과수업(감귤)',
    'b56e6b1f-5f2c-5926-a685-a082f28a02fe',
    '010-8901-2345',
    '고명식',
    true,
    NOW() - INTERVAL '4 years',
    NOW() - INTERVAL '4 days'
),

-- 화훼업
(
    gen_random_uuid(),
    '향기로운 꽃농장',
    '장미, 국화, 카네이션 등 다양한 화훼류를 재배하는 농장입니다.',
    '경기도 고양시 일산동구 백석동 369',
    '온실 1동~8동',
    '화훼업',
    'c67f7c2f-6f3d-6037-b796-b193f39b03ff',
    '010-9012-3456',
    '송미경',
    true,
    NOW() - INTERVAL '2 years 6 months',
    NOW() - INTERVAL '1 week'
),

-- 특용작물
(
    gen_random_uuid(),
    '건강한 버섯농장',
    '느타리버섯, 팽이버섯, 새송이버섯을 재배하는 현대식 버섯농장입니다.',
    '충청북도 충주시 가금면 용전리 741',
    '배양실, 재배실 1~12실',
    '특용작물(버섯)',
    'd78g8d3f-7f4e-7148-c8a7-c2a4f4ac04aa',
    '010-0123-4567',
    '임종화',
    true,
    NOW() - INTERVAL '1 year 8 months',
    NOW() - INTERVAL '6 days'
),
(
    gen_random_uuid(),
    '명품 인삼농장',
    '6년근 고려인삼을 재배하는 전통 인삼농장입니다. GAP 인증을 받았습니다.',
    '충청남도 금산군 금산읍 신대리 852',
    '인삼포 1~5포, 가공시설',
    '특용작물(인삼)',
    'e89h9e4f-8f5f-8259-d9b8-d3b5f5bd05bb',
    '010-1357-2468',
    '윤석구',
    true,
    NOW() - INTERVAL '5 years',
    NOW() - INTERVAL '12 days'
),

-- 수산업
(
    gen_random_uuid(),
    '청정바다 양식장',
    '친환경적으로 광어와 우럭을 양식하는 해상 양식장입니다.',
    '부산광역시 기장군 기장읍 연화리 963',
    '양식장 1~6호 가두리',
    '수산업(해상양식)',
    'f90i0f5f-9f6g-9360-eac9-e4c6f6ce06cc',
    '010-2468-1357',
    '어진수',
    true,
    NOW() - INTERVAL '2 years 3 months',
    NOW() - INTERVAL '8 days'
),

-- 복합농업
(
    gen_random_uuid(),
    '통합농장 그린베이스',
    '채소, 과일, 허브를 함께 재배하는 복합농장입니다. 체험프로그램도 운영합니다.',
    '경기도 파주시 적성면 설마리 159',
    '복합재배동 1~5동, 체험관',
    '복합농업',
    'a45d5a0f-4f1b-4815-9574-9971e17901fd',
    '010-3691-2580',
    '조영태',
    true,
    NOW() - INTERVAL '1 year 6 months',
    NOW() - INTERVAL '2 days'
),

-- 유기농업
(
    gen_random_uuid(),
    '자연그대로 유기농장',
    '100% 유기농 인증을 받은 친환경 농장입니다. 다양한 유기농 채소를 재배합니다.',
    '강원도 원주시 호저면 대곡리 753',
    '유기농 재배지 1~10구역',
    '유기농업',
    'b56e6b1f-5f2c-5926-a685-a082f28a02fe',
    '010-4815-9630',
    '나환경',
    true,
    NOW() - INTERVAL '3 years 2 months',
    NOW() - INTERVAL '5 days'
),

-- 스마트팜
(
    gen_random_uuid(),
    '미래농업 스마트팜',
    'IoT와 AI 기술을 접목한 최첨단 스마트팜입니다. 토마토와 파프리카를 재배합니다.',
    '경상남도 김해시 한림면 가야리 486',
    '스마트온실 1~6동, 제어실',
    '스마트농업',
    'c67f7c2f-6f3d-6037-b796-b193f39b03ff',
    '010-5927-4836',
    '테크윤',
    true,
    NOW() - INTERVAL '10 months',
    NOW() - INTERVAL '1 day'
),

-- 비활성화된 농장 (테스트용)
(
    gen_random_uuid(),
    '휴업중인 농장',
    '현재 휴업 중인 농장입니다.',
    '경기도 수원시 영통구 매탄동 777',
    '휴업시설',
    '기타',
    'd78g8d3f-7f4e-7148-c8a7-c2a4f4ac04aa',
    '010-0000-0000',
    '휴업자',
    false,
    NOW() - INTERVAL '2 years',
    NOW() - INTERVAL '6 months'
);

-- ============================================
-- 데이터 삽입 결과 확인
-- ============================================

-- 농장 유형별 개수 확인
SELECT 
    farm_type,
    COUNT(*) as farm_count,
    COUNT(CASE WHEN is_active = true THEN 1 END) as active_count,
    COUNT(CASE WHEN is_active = false THEN 1 END) as inactive_count
FROM public.farms
GROUP BY farm_type
ORDER BY farm_count DESC;

-- 최근 생성된 농장 확인
SELECT 
    farm_name,
    farm_type,
    farm_address,
    manager_name,
    is_active,
    created_at
FROM public.farms
ORDER BY created_at DESC
LIMIT 10;

-- 지역별 농장 분포 확인
SELECT 
    SPLIT_PART(farm_address, ' ', 1) as province,
    COUNT(*) as farm_count
FROM public.farms
WHERE is_active = true
GROUP BY SPLIT_PART(farm_address, ' ', 1)
ORDER BY farm_count DESC;

-- 농장 소유자 정보와 함께 확인
SELECT 
    f.farm_name,
    f.farm_type,
    f.manager_name,
    p.name as owner_name,
    p.email as owner_email,
    f.is_active
FROM public.farms f
JOIN public.profiles p ON f.owner_id = p.id
ORDER BY f.created_at DESC;

-- 농장 통계 요약
SELECT 
    COUNT(*) as total_farms,
    COUNT(CASE WHEN is_active = true THEN 1 END) as active_farms,
    COUNT(CASE WHEN is_active = false THEN 1 END) as inactive_farms,
    COUNT(DISTINCT farm_type) as farm_types_count,
    COUNT(DISTINCT owner_id) as unique_owners
FROM public.farms;

COMMIT;




1. 더미 데이터 생성
-- Supabase SQL Editor에서 실행
-- 테스트용 과거 방문자 데이터 생성
INSERT INTO visitor_entries (
  farm_id, 
  visit_datetime, 
  visitor_name, 
  visitor_phone, 
  visitor_address,
  visitor_purpose,
  disinfection_check,
  consent_given,
  created_at
)
SELECT 
  (SELECT id FROM farms LIMIT 1), -- 첫 번째 농장 ID 사용
  NOW() - (generate_series(1, 10) * INTERVAL '150 days'), -- 150일씩 과거로
  '테스트방문자' || generate_series(1, 10),
  '010-1234-567' || generate_series(1, 10),
  '서울시 테스트구 테스트동 ' || generate_series(1, 10) || '번지',
  '테스트 목적',
  true,
  true,
  NOW() - (generate_series(1, 10) * INTERVAL '150 days')
FROM generate_series(1, 10);

-----------------------------------------------------------------------------------------------------------------------------------

-- 테스트용 로그 생성
DO $$
DECLARE
    admin_user_id UUID;
    admin_email TEXT;
    farm_ids UUID[];
    visitor_ids UUID[];
    i INTEGER;
    random_date TIMESTAMP WITH TIME ZONE;
    log_levels TEXT[] := ARRAY['error', 'warn', 'info', 'debug'];
    actions TEXT[] := ARRAY[
        'USER_LOGIN', 'USER_LOGOUT', 'USER_CREATE', 'USER_UPDATE', 'USER_DELETE',
        'FARM_CREATE', 'FARM_UPDATE', 'FARM_DELETE', 'FARM_MEMBER_ADD', 'FARM_MEMBER_REMOVE',
        'VISITOR_CREATE', 'VISITOR_UPDATE', 'VISITOR_DELETE', 'VISITOR_ENTRY',
        'SYSTEM_BACKUP', 'SYSTEM_MAINTENANCE', 'SYSTEM_ERROR', 'SYSTEM_CONFIG_UPDATE',
        'SECURITY_LOGIN_FAILED', 'SECURITY_PASSWORD_RESET', 'SECURITY_ACCOUNT_LOCKED',
        'NOTIFICATION_SENT', 'NOTIFICATION_FAILED', 'API_REQUEST', 'API_ERROR',
        'SCHEDULED_JOB', 'DATA_EXPORT', 'DATA_IMPORT', 'FILE_UPLOAD'
    ];
    resource_types TEXT[] := ARRAY['farm', 'user', 'visitor', 'system'];
    user_agents TEXT[] := ARRAY[
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
        'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X)',
        'Mozilla/5.0 (Android 11; Mobile; rv:68.0) Gecko/68.0'
    ];
BEGIN
    -- 첫 번째 관리자 사용자 정보 가져오기
    SELECT id, email INTO admin_user_id, admin_email
    FROM profiles 
    WHERE account_type = 'admin' 
    ORDER BY created_at 
    LIMIT 1;

    -- 농장 ID 목록 가져오기
    SELECT ARRAY_AGG(id) INTO farm_ids FROM farms LIMIT 10;
    
    -- 방문자 ID 목록 가져오기 (있다면)
    SELECT ARRAY_AGG(id) INTO visitor_ids FROM visitor_entries LIMIT 50;

    -- 더미 로그 데이터 생성 (최근 6개월 동안)
    FOR i IN 1..1000 LOOP
        -- 랜덤 날짜 생성 (최근 6개월)
        random_date := NOW() - (RANDOM() * INTERVAL '180 days');
        
        INSERT INTO system_logs (
            level,
            action,
            message,
            user_id,
            user_email,
            user_ip,
            user_agent,
            resource_type,
            resource_id,
            metadata,
            created_at
        ) VALUES (
            -- 로그 레벨 (가중치: info 50%, warn 25%, error 15%, debug 10%)
            CASE 
                WHEN RANDOM() < 0.5 THEN 'info'
                WHEN RANDOM() < 0.75 THEN 'warn'
                WHEN RANDOM() < 0.9 THEN 'error'
                ELSE 'debug'
            END,
            
            -- 액션 (랜덤 선택)
            actions[1 + FLOOR(RANDOM() * array_length(actions, 1))],
            
            -- 메시지 (액션에 따라 다른 메시지)
            CASE actions[1 + FLOOR(RANDOM() * array_length(actions, 1))]
                WHEN 'USER_LOGIN' THEN '사용자 로그인: ' || COALESCE(admin_email, 'unknown@example.com')
                WHEN 'USER_LOGOUT' THEN '사용자 로그아웃: ' || COALESCE(admin_email, 'unknown@example.com')
                WHEN 'VISITOR_CREATE' THEN '방문자 등록: 새로운 방문자가 등록되었습니다'
                WHEN 'VISITOR_ENTRY' THEN '방문자 입장: 방문자가 농장에 입장했습니다'
                WHEN 'FARM_CREATE' THEN '농장 생성: 새로운 농장이 등록되었습니다'
                WHEN 'SYSTEM_BACKUP' THEN '시스템 백업: 정기 백업이 완료되었습니다'
                WHEN 'SYSTEM_ERROR' THEN '시스템 오류: ' || (ARRAY['데이터베이스 연결 실패', '메모리 부족', '디스크 공간 부족', 'API 응답 시간 초과'])[1 + FLOOR(RANDOM() * 4)]
                WHEN 'SECURITY_LOGIN_FAILED' THEN '로그인 실패: 잘못된 비밀번호 시도'
                WHEN 'API_REQUEST' THEN 'API 요청: ' || (ARRAY['/api/farms', '/api/visitors', '/api/users', '/api/settings'])[1 + FLOOR(RANDOM() * 4)]
                WHEN 'SCHEDULED_JOB' THEN '스케줄 작업: ' || (ARRAY['데이터 정리', '백업 실행', '알림 발송', '통계 생성'])[1 + FLOOR(RANDOM() * 4)]
                ELSE '시스템 이벤트: ' || actions[1 + FLOOR(RANDOM() * array_length(actions, 1))] || ' 실행됨'
            END,
            
            -- 사용자 정보 (80% 확률로 관리자, 20% 확률로 NULL)
            CASE WHEN RANDOM() < 0.8 THEN admin_user_id ELSE NULL END,
            CASE WHEN RANDOM() < 0.8 THEN admin_email ELSE 'system@farm.com' END,
            
            -- IP 주소 (랜덤 생성)
            '192.168.' || FLOOR(RANDOM() * 255) || '.' || FLOOR(RANDOM() * 255),
            
            -- User Agent (랜덤 선택)
            user_agents[1 + FLOOR(RANDOM() * array_length(user_agents, 1))],
            
            -- 리소스 타입 (랜덤 선택)
            resource_types[1 + FLOOR(RANDOM() * array_length(resource_types, 1))],
            
            -- 리소스 ID (농장 또는 방문자 ID, 또는 NULL)
            CASE 
                WHEN farm_ids IS NOT NULL AND array_length(farm_ids, 1) > 0 AND RANDOM() < 0.3 
                THEN farm_ids[1 + FLOOR(RANDOM() * array_length(farm_ids, 1))]
                WHEN visitor_ids IS NOT NULL AND array_length(visitor_ids, 1) > 0 AND RANDOM() < 0.2 
                THEN visitor_ids[1 + FLOOR(RANDOM() * array_length(visitor_ids, 1))]
                ELSE NULL
            END,
            
            -- 메타데이터 (JSON)
            jsonb_build_object(
                'timestamp', random_date,
                'session_id', 'sess_' || substr(md5(random()::text), 1, 16),
                'request_id', 'req_' || substr(md5(random()::text), 1, 12),
                'duration_ms', FLOOR(RANDOM() * 5000),
                'status_code', CASE 
                    WHEN RANDOM() < 0.8 THEN 200
                    WHEN RANDOM() < 0.9 THEN 400
                    WHEN RANDOM() < 0.95 THEN 404
                    ELSE 500
                END,
                'additional_info', jsonb_build_object(
                    'browser', (ARRAY['Chrome', 'Firefox', 'Safari', 'Edge'])[1 + FLOOR(RANDOM() * 4)],
                    'os', (ARRAY['Windows', 'macOS', 'Linux', 'iOS', 'Android'])[1 + FLOOR(RANDOM() * 5)],
                    'device', (ARRAY['desktop', 'mobile', 'tablet'])[1 + FLOOR(RANDOM() * 3)]
                )
            ),
            
            -- 생성 시간
            random_date
        );
        
        -- 진행 상황 출력 (100개마다)
        IF i % 100 = 0 THEN
            RAISE NOTICE '더미 로그 데이터 생성 진행률: %/1000', i;
        END IF;
    END LOOP;
    
    RAISE NOTICE '시스템 로그 더미 데이터 1000개 생성 완료!';
END $$;

-- 생성된 데이터 확인
SELECT 
    level,
    COUNT(*) as count,
    MIN(created_at) as oldest,
    MAX(created_at) as newest
FROM system_logs 
GROUP BY level 
ORDER BY level;

-- 액션별 통계
SELECT 
    action,
    COUNT(*) as count
FROM system_logs 
GROUP BY action 
ORDER BY count DESC 
LIMIT 10;

-- 최근 로그 몇 개 확인
SELECT 
    level,
    action,
    message,
    user_email,
    created_at
FROM system_logs 
ORDER BY created_at DESC 
LIMIT 10;