--------------------------------------------------
-- 1. 버킷 생성
--------------------------------------------------
INSERT INTO storage.buckets (id, name, public) VALUES ('profiles', 'profiles', false);

-- public: false = 비공개 버킷 (인증된 사용자만 접근 가능)
-- public: true = 공개 버킷 (누구나 접근 가능)

--------------------------------------------------
-- 2. RLS(Row Level Security) 활성화
--------------------------------------------------
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

--------------------------------------------------
-- 3. INSERT 정책 (파일 업로드)
--------------------------------------------------
DROP POLICY IF EXISTS "프로필 이미지 업로드 정책" ON storage.objects;

CREATE POLICY "프로필/시스템 이미지 업로드 정책" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
    bucket_id = 'profiles'
    AND (
        -- 자신의 폴더에 업로드
        (auth.uid())::text = (storage.foldername(name))[1]
        -- systems 폴더는 관리자만 업로드 가능
        OR (
            (storage.foldername(name))[1] = 'systems'
            AND EXISTS (
                SELECT 1 FROM public.profiles
                WHERE id = auth.uid() AND account_type = 'admin'
            )
        )
    )
);

--------------------------------------------------
-- 4. SELECT 정책 (파일 조회)
--------------------------------------------------
CREATE POLICY "프로필 이미지 조회 정책" ON storage.objects
FOR SELECT TO authenticated  -- 인증된 사용자만 조회 가능
USING (
    bucket_id = 'profiles'  -- profiles 버킷에만 적용
    AND 
    (
        -- 자신의 이미지이거나
        (auth.uid())::text = (storage.foldername(name))[1]
        OR
        -- 관리자이거나
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND account_type = 'admin'
        )
        OR
        -- 같은 농장의 구성원인 경우
        EXISTS (
            SELECT 1 FROM public.farm_members fm
            WHERE fm.user_id = (storage.foldername(name))[1]::uuid
            AND fm.farm_id IN (
                SELECT farm_id FROM public.farm_members
                WHERE user_id = auth.uid()
            )
        )
    )
);

--------------------------------------------------
-- 5. UPDATE 정책 (파일 수정)
--------------------------------------------------
DROP POLICY IF EXISTS "프로필 이미지 수정 정책" ON storage.objects;

CREATE POLICY "프로필/시스템 이미지 수정 정책" ON storage.objects
FOR UPDATE TO authenticated
USING (
    bucket_id = 'profiles'
    AND (
        (auth.uid())::text = (storage.foldername(name))[1]
        OR (
            (storage.foldername(name))[1] = 'systems'
            AND EXISTS (
                SELECT 1 FROM public.profiles
                WHERE id = auth.uid() AND account_type = 'admin'
            )
        )
    )
)
WITH CHECK (
    bucket_id = 'profiles'
    AND (
        (auth.uid())::text = (storage.foldername(name))[1]
        OR (
            (storage.foldername(name))[1] = 'systems'
            AND EXISTS (
                SELECT 1 FROM public.profiles
                WHERE id = auth.uid() AND account_type = 'admin'
            )
        )
    )
    AND COALESCE((metadata->>'size')::int, 0) <= 5 * 1024 * 1024
    AND lower(metadata->>'mimetype') = ANY (ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'image/x-icon'])
);

--------------------------------------------------
-- 6. DELETE 정책 (파일 삭제)
--------------------------------------------------
DROP POLICY IF EXISTS "프로필 이미지 삭제 정책" ON storage.objects;

CREATE POLICY "프로필/시스템 이미지 삭제 정책" ON storage.objects
FOR DELETE TO authenticated
USING (
    bucket_id = 'profiles'
    AND (
        (auth.uid())::text = (storage.foldername(name))[1]
        OR (
            (storage.foldername(name))[1] = 'systems'
            AND EXISTS (
                SELECT 1 FROM public.profiles
                WHERE id = auth.uid() AND account_type = 'admin'
            )
        )
        OR
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND account_type = 'admin'
        )
    )
);

-- visitor-photos 버킷이 없다면 생성
CREATE BUCKET IF NOT EXISTS "visitor-photos";

-- 버킷을 public으로 설정
ALTER BUCKET "visitor-photos"
SET public = true;

-- 기존 정책 삭제 (있다면)
DROP POLICY IF EXISTS "방문자 이미지 업로드 정책" ON storage.objects;
DROP POLICY IF EXISTS "방문자 이미지 조회 정책" ON storage.objects;
DROP POLICY IF EXISTS "방문자 이미지 삭제 정책" ON storage.objects;
DROP POLICY IF EXISTS "방문자 이미지 업데이트 정책" ON storage.objects;

-- 업로드 정책 생성
CREATE POLICY "방문자 이미지 업로드 정책"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (
  bucket_id::text = 'visitor-photos'::text
);

-- 조회 정책 생성
CREATE POLICY "방문자 이미지 조회 정책"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id::text = 'visitor-photos'::text);

-- 삭제 정책 생성
CREATE POLICY "방문자 이미지 삭제 정책"
ON storage.objects
FOR DELETE
TO public
USING (bucket_id::text = 'visitor-photos'::text);

-- 업데이트 정책 생성
CREATE POLICY "방문자 이미지 업데이트 정책"
ON storage.objects
FOR UPDATE
TO public
USING (bucket_id::text = 'visitor-photos'::text)
WITH CHECK (bucket_id::text = 'visitor-photos'::text);


-- 정책 문법 설명
-- 1. 기본 구조
--     CREATE POLICY "정책_이름" ON storage.objects
--     FOR [작업_유형] TO [사용자_유형]
--     [USING (조회_조건)]  -- SELECT, UPDATE, DELETE에 사용
--     [WITH CHECK (생성_조건)]  -- INSERT, UPDATE에 사용

-- 2. 작업 유형:
--     FOR INSERT: 파일 업로드
--     FOR SELECT: 파일 조회
--     FOR UPDATE: 파일 수정
--     FOR DELETE: 파일 삭제
--     FOR ALL: 모든 작업

-- 3. 사용자 유형:
--     TO authenticated: 인증된 사용자
--     TO anon: 익명 사용자
--     TO public: 모든 사용자

-- 4. 조건절:
--     USING: SELECT, UPDATE, DELETE 작업 시 적용될 조건
--     WITH CHECK: INSERT, UPDATE 작업 시 적용될 조건

-- 5. 둘 다 있는 경우(UPDATE):
--     USING은 수정할 파일을 찾는 조건
--     WITH CHECK는 새로운 데이터의 유효성 검사 조건

--     const { data, error } = await supabase.storage
--     .from('profiles')
--     .upload(`${userId}/avatar.jpg`, file);

--     const { data, error } = await supabase.storage
--     .from('profiles')
--     .download(`${userId}/avatar.jpg`);

--     const { error: deleteError } = await supabase.storage
--     .from('profiles')
--     .remove([`${userId}/avatar.jpg`]);

--     const { data, error: uploadError } = await supabase.storage
--     .from('profiles')
--     .upload(`${userId}/avatar.jpg`, newFile);

--     const { error } = await supabase.storage
--     .from('profiles')
--     .remove([`${userId}/avatar.jpg`]);