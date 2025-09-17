DO $$
DECLARE
  target_farm_id uuid;
  i int;

  names  text[] := ARRAY['김','이','박','최','정','조','윤','장','임','한','오','서','신','권','황'];
  syll1  text[] := ARRAY['민','서','도','하','주','지','윤','수','연','현','예','유','아','찬','경','진','태','시'];
  syll2  text[] := ARRAY['준','원','현','우','연','영','빈','윤','민','호','율','채','린','혁','결','아','석','서','형'];
  cities text[] := ARRAY['서울','부산','대구','인천','광주','대전','울산','수원','용인','성남','창원','고양','세종'];
  dongs  text[] := ARRAY['중앙로','서초대로','테헤란로','가산디지털','광안리','해운대','동성로','충장로','노은로','팔달로'];
  purposes text[] := ARRAY['납품','점검','미팅','수의사 진료','사료 배송','방역','견학','기타'];

  -- KST에서 보이길 원하는 시간대 (조정 가능)
  min_hour int := 6;    -- 06시(KST)
  max_hour int := 21;   -- 21시(KST)

  day_offset int;
  h int;
  m int;
  s int;

  kst_midnight timestamp;  -- KST 기준 자정(타임존 없는 로컬 타임스탬프)
  local_kst_ts  timestamp; -- KST 로컬 목표 시각
  utc_ts        timestamptz; -- DB 저장용 UTC
BEGIN
  SELECT id INTO target_farm_id FROM public.farms ORDER BY created_at ASC LIMIT 1;
  IF target_farm_id IS NULL THEN
    RAISE EXCEPTION 'No farms exist. Create a farm first.';
  END IF;

  -- 오늘의 KST 자정 (타임존 없는 로컬 시각)
  kst_midnight := date_trunc('day', (now() AT TIME ZONE 'Asia/Seoul'));

  FOR i IN 1..200 LOOP
    -- 최근 60일 내 랜덤 날짜 + KST에서 06~21시 사이 랜덤 시각
    day_offset := floor(random()*60)::int;
    h := min_hour + floor(random() * (max_hour - min_hour + 1))::int;
    m := floor(random()*60)::int;
    s := floor(random()*60)::int;

    -- 1) KST 로컬 목표 시각 생성
    local_kst_ts := kst_midnight
                    - (day_offset || ' days')::interval
                    + make_interval(hours => h, mins => m, secs => s);

    -- 2) KST 로컬을 UTC timestamptz로 변환하여 저장
    utc_ts := local_kst_ts AT TIME ZONE 'Asia/Seoul';

    INSERT INTO public.visitor_entries
      (id, farm_id, visit_datetime, visitor_name, visitor_phone, visitor_address, visitor_purpose,
       disinfection_check, vehicle_number, notes, registered_by, consent_given, created_at, updated_at)
    VALUES
      (gen_random_uuid(),
       target_farm_id,
       utc_ts,  -- ✅ DB에는 UTC로 저장되지만, KST로 보면 06~21시에 표시됨
       (names[1+floor(random()*array_length(names,1))::int] ||
        syll1[1+floor(random()*array_length(syll1,1))::int] ||
        syll2[1+floor(random()*array_length(syll2,1))::int]),
       '010-' || LPAD((1000+floor(random()*9000))::text,4,'0') || '-' ||
                LPAD((1000+floor(random()*9000))::text,4,'0'),
       (cities[1+floor(random()*array_length(cities,1))::int] || '시 ' ||
        dongs[1+floor(random()*array_length(dongs,1))::int] || ' ' ||
        (10+floor(random()*190))::text),
       purposes[1+floor(random()*array_length(purposes,1))::int],
       (random() < 0.7),
       CASE WHEN random() < 0.6 THEN
         ( (10+floor(random()*90))::int
           || (ARRAY['가','나','다','라','마','거','너','더','러','머','버','서','어','저'])[1+floor(random()*14)::int]
           || (1000+floor(random()*9000))::int )::text
       ELSE NULL END,
       CASE WHEN random() < 0.3 THEN '비고: 테스트' ELSE NULL END,
       NULL,
       TRUE,
       NOW(), NOW());
  END LOOP;
END $$;