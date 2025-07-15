// /src/lib/utils/validation.ts
import type { QuoteRequestDetails } from '@/types/quote';

/**
 * 견적 요청 데이터 유효성 검사
 */
export function validateQuoteRequest(data: Partial<QuoteRequestDetails>): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // 구매 대상 검사
  if (!data.purchaseTarget) {
    errors.push('구매 대상을 선택해주세요.');
  }

  // 연령대 검사
  if (!data.age) {
    errors.push('사용자 연령대를 선택해주세요.');
  }

  // 현재 통신사 검사
  if (!data.currentCarrier) {
    errors.push('현재 사용중인 통신사를 선택해주세요.');
  }

  // 변경 타입 검사
  if (!data.changeType) {
    errors.push('통신사 변경 의향을 선택해주세요.');
  }

  // 번호이동/신규가입시 새 통신사 검사
  if ((data.changeType === 'port' || data.changeType === 'new') && !data.newCarrier) {
    errors.push('가입할 통신사를 선택해주세요.');
  }

  // 데이터 사용량 검사
  if (!data.dataUsage) {
    errors.push('데이터 사용량을 선택해주세요.');
  }

  // 디바이스 검사
  if (!data.deviceId) {
    errors.push('구매할 휴대폰을 선택해주세요.');
  }

  // 색상 검사
  if (!data.color) {
    errors.push('색상을 선택해주세요.');
  }

  // 지역 검사
  if (!data.locations || data.locations.length === 0) {
    errors.push('견적을 받을 지역을 선택해주세요.');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * 단계별 필수 필드 검사
 */
export function validateStep(step: number, data: Partial<QuoteRequestDetails>): boolean {
  switch (step) {
    case 2:
      return !!(data.purchaseTarget && data.age);
    case 3:
      return !!data.currentCarrier;
    case 4:
      return !!(data.changeType && (data.changeType === 'device_only' || data.newCarrier));
    case 5:
      return !!data.dataUsage;
    case 6:
      return !!(data.deviceId && data.color);
    case 7:
      return !!(data.locations && data.locations.length > 0);
    default:
      return true;
  }
}

/**
 * 이메일 유효성 검사
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * 전화번호 유효성 검사 (한국 번호)
 */
export function validatePhoneNumber(phone: string): boolean {
  const phoneRegex = /^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
}

/**
 * 전화번호 포맷팅
 */
export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  const match = cleaned.match(/^(01[0-9])([0-9]{3,4})([0-9]{4})$/);
  
  if (match) {
    return `${match[1]}-${match[2]}-${match[3]}`;
  }
  
  return phone;
}