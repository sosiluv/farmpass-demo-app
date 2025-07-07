/**
 * 텍스트 유틸리티 함수들
 */

/**
 * 이름에서 이니셜을 생성하는 함수
 * 한글과 영문을 모두 지원
 */
export function generateInitials(name: string | null | undefined): string {
  if (!name || typeof name !== 'string') {
    return '?';
  }

  const trimmedName = name.trim();
  if (!trimmedName) {
    return '?';
  }

  // 한글인 경우 마지막 글자 사용
  const koreanRegex = /[가-힣]/;
  if (koreanRegex.test(trimmedName)) {
    return trimmedName.charAt(trimmedName.length - 1);
  }

  // 영문인 경우 첫 글자들 조합
  const words = trimmedName.split(' ').filter(word => word.length > 0);
  if (words.length === 1) {
    return words[0].charAt(0).toUpperCase();
  }
  
  return words
    .slice(0, 2)
    .map(word => word.charAt(0).toUpperCase())
    .join('');
}

/**
 * 텍스트 자르기 (말줄임표 포함)
 */
export function truncateText(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) {
    return text;
  }
  return text.slice(0, maxLength) + '...';
}

/**
 * 전화번호 포맷팅
 */
export function formatPhoneNumber(phone: string): string {
  if (!phone) return '';
  
  const cleaned = phone.replace(/\D/g, '');
  const match = cleaned.match(/^(\d{3})(\d{4})(\d{4})$/);
  
  if (match) {
    return `${match[1]}-${match[2]}-${match[3]}`;
  }
  
  return phone;
}

/**
 * 이메일 마스킹
 */
export function maskEmail(email: string): string {
  if (!email || !email.includes('@')) {
    return email;
  }
  
  const [localPart, domain] = email.split('@');
  const maskedLocal = localPart.length > 2 
    ? localPart.slice(0, 2) + '*'.repeat(localPart.length - 2)
    : localPart;
    
  return `${maskedLocal}@${domain}`;
}
