#!/bin/bash

# =================================
# 🌾 농장 출입 관리 시스템 배포 스크립트
# =================================

set -e  # 오류 발생 시 스크립트 중단

echo "🚀 배포 프로세스를 시작합니다..."

# 1. 환경 변수 확인
echo "📋 환경 변수 확인 중..."
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ]; then
    echo "❌ NEXT_PUBLIC_SUPABASE_URL이 설정되지 않았습니다."
    exit 1
fi

if [ -z "$NEXT_PUBLIC_SUPABASE_ANON_KEY" ]; then
    echo "❌ NEXT_PUBLIC_SUPABASE_ANON_KEY가 설정되지 않았습니다."
    exit 1
fi

if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL이 설정되지 않았습니다."
    exit 1
fi

echo "✅ 환경 변수 확인 완료"

# 2. 의존성 설치
echo "📦 의존성 설치 중..."
npm ci --only=production

# 3. Prisma 클라이언트 생성
echo "🗄️ Prisma 클라이언트 생성 중..."
npx prisma generate

# 4. 데이터베이스 마이그레이션
echo "🔄 데이터베이스 마이그레이션 중..."
npx prisma migrate deploy

# 5. 빌드
echo "🔨 프로덕션 빌드 중..."
npm run build

# 6. 타입 체크
echo "🔍 TypeScript 타입 체크 중..."
npx tsc --noEmit

# 7. 린트 체크
echo "🧹 ESLint 체크 중..."
npm run lint

echo "✅ 배포 준비 완료!"
echo "🎯 다음 명령어로 서버를 시작하세요:"
echo "   npm start" 