// /src/types/quote.ts
export interface QuoteRequestDetails {
  // Step 2: 구매 대상
  purchaseTarget: 'self' | 'other';
  age: 'general' | 'youth' | 'teen' | 'kids' | 'senior';
  
  // Step 3: 현재 통신사
  currentCarrier: 'skt' | 'kt' | 'lgu' | 'mvno';
  
  // Step 4: 통신사 변경 의향
  changeType: 'port' | 'device_only' | 'new';
  newCarrier?: 'skt' | 'kt' | 'lgu' | 'mvno';
  
  // Step 5: 데이터 사용량
  dataUsage: 'unlimited' | '50gb_plus' | '10gb_plus' | '9gb_under' | '5gb_under';
  
  // Step 6: 휴대폰 모델
  deviceId: string;
  color: string;
  
  // Step 7: 지역 선택
  locations: string[];
}

export interface QuoteRequest {
  id: string;
  user_id: string;
  product_type: 'mobile_phone' | 'internet';
  request_details: QuoteRequestDetails;
  status: 'open' | 'closed' | 'expired';
  created_at: string;
  deleted_at?: string;
}