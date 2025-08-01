// Common types for the user-app

// Location and Place types
export interface KakaoPlace {
  place_name: string;
  address_name: string;
  road_address_name: string;
  x: string;
  y: string;
  distance?: string;
}

export interface Coordinates {
  lat: number;
  lng: number;
}

// Quote types
export interface QuoteData {
  deviceId?: string;
  storage?: string;
  color?: string;
  carrierCode?: string;
  planId?: string;
  contract?: string;
  discountType?: string;
  installment?: number;
}

export interface QuoteRequest {
  id: string;
  user_id: string;
  request_details: QuoteData;
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  status: string;
  created_at: string;
}

export interface Quote {
  id: string;
  request_id: string;
  store_id: string;
  quote_details: {
    tco_24months: number;
    [key: string]: unknown;
  };
  created_at: string;
}

// Notification types
export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: {
    url?: string;
    type?: string;
    [key: string]: unknown;
  };
}

// API Response types
export interface ApiError {
  message: string;
  code?: string;
}

// Store types
export interface Store {
  id: string;
  name: string;
}

// Device types
export interface Device {
  id: string;
  device_name: string;
  storage_options: number[];
}