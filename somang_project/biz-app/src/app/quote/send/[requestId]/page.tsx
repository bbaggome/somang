// /biz-app/src/app/quote/send/[requestId]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

interface QuoteRequest {
  id: string;
  created_at: string;
  status: "open" | "closed" | "expired";
  product_type: string;
  request_details: {
    purchaseTarget: string;
    age: string;
    currentCarrier: string;
    changeType: string;
    newCarrier?: string;
    dataUsage: string;
    deviceId: string;
    color: string;
    locations: string[];
  };
  user_profiles: {
    name: string;
    phone_number?: string;
  } | null;
}

interface Device {
  id: string;
  manufacturer: string;
  device_name: string;
  device_code: string;
  storage_options: number[];
  colors: string[];
}

interface Store {
  id: string;
  name: string;
  phone_number: string;
  base_address: string;
}

interface QuoteDetails {
  // 기본 정보
  device_price: number;
  monthly_fee: number;
  activation_fee: number;

  // 할인 정보
  device_discount: number;
  plan_discount: number;
  additional_discount: number;

  // TCO (Total Cost of Ownership)
  tco_24months: number;

  // 특별 혜택
  special_benefits: string[];

  // 기타 조건
  contract_period: number; // 개월
  installation_method: "visit" | "delivery" | "pickup";
  delivery_fee: number;

  // 메모
  store_memo: string;
}

export default function QuoteSendPage() {
  const router = useRouter();
  const params = useParams();
  const requestId = params.requestId as string;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [quoteRequest, setQuoteRequest] = useState<QuoteRequest | null>(null);
  const [device, setDevice] = useState<Device | null>(null);
  const [store, setStore] = useState<Store | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 견적 상세 정보
  const [quoteDetails, setQuoteDetails] = useState<QuoteDetails>({
    device_price: 0,
    monthly_fee: 0,
    activation_fee: 30000,
    device_discount: 0,
    plan_discount: 0,
    additional_discount: 0,
    tco_24months: 0,
    special_benefits: [],
    contract_period: 24,
    installation_method: "visit",
    delivery_fee: 0,
    store_memo: "",
  });

  useEffect(() => {
    if (requestId) {
      loadQuoteRequest();
    }
  }, [requestId]);

  // TCO 자동 계산
  useEffect(() => {
    calculateTCO();
  }, [
    quoteDetails.device_price,
    quoteDetails.monthly_fee,
    quoteDetails.activation_fee,
    quoteDetails.device_discount,
    quoteDetails.plan_discount,
    quoteDetails.additional_discount,
    quoteDetails.delivery_fee,
    quoteDetails.contract_period,
  ]);

  const loadQuoteRequest = async () => {
    try {
      setLoading(true);

      console.log("견적 요청 로드 시작, requestId:", requestId);

      // 1. 견적 요청 정보만 먼저 로드
      const { data: requestData, error: requestError } = await supabase
        .from("quote_requests")
        .select("*")
        .eq("id", requestId)
        .single();

      if (requestError) {
        console.error("견적 요청 로드 오류:", requestError);
        throw requestError;
      }

      console.log("견적 요청 데이터:", requestData);

      // 2. 사용자 프로필 정보 별도 로드
      let userProfile = null;
      if (requestData.user_id) {
        console.log("사용자 프로필 로드 시작, user_id:", requestData.user_id);

        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("name, phone_number")
          .eq("id", requestData.user_id)
          .single();

        if (profileError) {
          console.warn("프로필 로드 실패:", profileError);
          // 프로필 로드 실패해도 견적 요청은 계속 처리
          userProfile = { name: "고객", phone_number: null };
        } else {
          console.log("프로필 데이터:", profileData);
          userProfile = profileData;
        }
      } else {
        console.warn("user_id가 없습니다.");
        userProfile = { name: "고객", phone_number: null };
      }

      // 3. 데이터 결합
      const transformedRequest = {
        ...requestData,
        user_profiles: userProfile,
      } as QuoteRequest;

      setQuoteRequest(transformedRequest);

      // 4. 디바이스 정보 로드
      if (transformedRequest.request_details?.deviceId) {
        console.log(
          "디바이스 정보 로드 시작, deviceId:",
          transformedRequest.request_details.deviceId
        );

        const { data: deviceData, error: deviceError } = await supabase
          .from("devices")
          .select("*")
          .eq("id", transformedRequest.request_details.deviceId)
          .single();

        if (deviceError) {
          console.error("디바이스 정보 로드 실패:", deviceError);
          setError("디바이스 정보를 불러올 수 없습니다.");
          return;
        } else {
          console.log("디바이스 데이터:", deviceData);
          setDevice(deviceData);

          // 기기별 기본 가격 설정 (임시 로직)
          const basePrice = deviceData.device_name.includes("Pro")
            ? 1500000
            : deviceData.device_name.includes("Ultra")
            ? 1800000
            : 1200000;

          setQuoteDetails((prev) => ({
            ...prev,
            device_price: basePrice,
          }));
        }
      } else {
        console.warn("deviceId가 없습니다.");
        setError("디바이스 정보가 없습니다.");
        return;
      }

      // 5. 현재 사용자의 매장 정보 로드
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        console.log("매장 정보 로드 시작, owner_id:", user.id);

        const { data: storeData, error: storeError } = await supabase
          .from("stores")
          .select("*")
          .eq("owner_id", user.id)
          .single();

        if (storeError) {
          console.error("매장 정보 로드 실패:", storeError);
          setError("매장 정보를 찾을 수 없습니다. 매장 등록이 필요합니다.");
          return;
        } else {
          console.log("매장 데이터:", storeData);
          setStore(storeData);
        }
      } else {
        console.error("인증된 사용자가 없습니다.");
        setError("로그인이 필요합니다.");
        return;
      }
    } catch (error: any) {
      console.error("견적 요청 로드 실패:", error);
      setError(`견적 요청 정보를 불러올 수 없습니다: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const calculateTCO = () => {
    const {
      device_price,
      monthly_fee,
      activation_fee,
      device_discount,
      plan_discount,
      additional_discount,
      delivery_fee,
      contract_period,
    } = quoteDetails;

    const totalDeviceCost = Math.max(0, device_price - device_discount);
    const totalPlanCost = (monthly_fee - plan_discount) * contract_period;
    const totalCost =
      totalDeviceCost +
      totalPlanCost +
      activation_fee +
      delivery_fee -
      additional_discount;

    setQuoteDetails((prev) => ({
      ...prev,
      tco_24months: Math.max(0, totalCost),
    }));
  };

  const handleInputChange = (field: keyof QuoteDetails, value: any) => {
    setQuoteDetails((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleBenefitToggle = (benefit: string) => {
    setQuoteDetails((prev) => ({
      ...prev,
      special_benefits: prev.special_benefits.includes(benefit)
        ? prev.special_benefits.filter((b) => b !== benefit)
        : [...prev.special_benefits, benefit],
    }));
  };

  const handleSubmit = async () => {
    if (!quoteRequest || !store) {
      setError("필요한 정보가 없습니다.");
      return;
    }

    // 유효성 검사
    if (quoteDetails.device_price <= 0) {
      setError("기기 가격을 입력해주세요.");
      return;
    }
    if (quoteDetails.monthly_fee <= 0) {
      setError("월 이용료를 입력해주세요.");
      return;
    }

    setSubmitting(true);
    try {
      console.log("견적 전송 시작");
      console.log("Store ID:", store.id);
      console.log("Request ID:", requestId);
      console.log("Quote Details:", quoteDetails);

      // 현재 사용자 확인
      const {
        data: { user },
      } = await supabase.auth.getUser();
      console.log("Current user:", user?.id);

      // 매장 소유권 확인
      const { data: storeCheck, error: storeError } = await supabase
        .from("stores")
        .select("id, owner_id, name")
        .eq("id", store.id)
        .eq("owner_id", user?.id)
        .single();

      if (storeError || !storeCheck) {
        console.error("매장 소유권 확인 실패:", storeError);
        setError("매장 정보를 확인할 수 없습니다.");
        return;
      }

      console.log("매장 소유권 확인됨:", storeCheck);

      // 견적 생성
      const { data: quoteData, error: quoteError } = await supabase
        .from("quotes")
        .insert({
          request_id: requestId,
          store_id: store.id,
          quote_details: quoteDetails,
          status: "sent",
        })
        .select()
        .single();

      if (quoteError) {
        console.error("견적 생성 오류:", quoteError);

        // 구체적인 오류 메시지
        if (quoteError.code === "42501") {
          setError("견적 생성 권한이 없습니다. 매장 등록 상태를 확인해주세요.");
        } else if (quoteError.code === "23505") {
          setError("이미 이 요청에 대한 견적을 보냈습니다.");
        } else {
          setError(`견적 생성 실패: ${quoteError.message}`);
        }
        return;
      }

      console.log("견적 생성 성공:", quoteData);

      // FCM 푸시 알림 전송
      try {
        console.log("FCM 푸시 알림 전송 시작...");
        
        const fcmResponse = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-firebase-fcm-notification`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_ids: [quoteRequest.user_id], // 견적 요청한 사용자에게 알림
            notification: {
              title: "💼 새로운 견적이 도착했습니다!",
              body: `${store.name}에서 ${device.device_name} 견적을 보내드렸습니다. 총 비용: ${formatCurrency(quoteDetails.tco_24months)}원`,
              android: {
                channel_id: "quote_notifications",
                priority: "high",
                sound: "default",
                color: "#1e40af",
                icon: "ic_notification"
              },
              apns: {
                payload: {
                  aps: {
                    sound: "default",
                    badge: 1
                  }
                }
              }
            },
            data: {
              type: "quote_received",
              quote_id: quoteData.id,
              request_id: requestId,
              store_name: store.name,
              device_name: device.device_name,
              total_cost: quoteDetails.tco_24months.toString(),
              timestamp: new Date().toISOString()
            },
            quote_data: {
              quote_id: quoteData.id,
              business_name: store.name,
              amount: quoteDetails.tco_24months
            }
          })
        });

        const fcmResult = await fcmResponse.json();
        
        if (fcmResponse.ok && fcmResult.success) {
          console.log("✅ FCM 푸시 알림 전송 성공:", fcmResult);
          console.log(`FCM 알림 전송됨 - 성공: ${fcmResult.sent}, 실패: ${fcmResult.failed}`);
        } else {
          console.warn("⚠️ FCM 푸시 알림 전송 실패:", fcmResult);
        }
      } catch (fcmError) {
        console.error("❌ FCM 푸시 알림 전송 오류:", fcmError);
        // FCM 실패해도 견적 전송은 성공으로 처리
      }

      console.log("견적 전송 완료 - FCM 푸시 알림도 전송되었습니다");
      
      alert("견적서가 성공적으로 전송되었습니다!\n고객에게 푸시 알림도 발송되었습니다.");
      
      // 성공 후 리다이렉트
      router.back();
    } catch (error: any) {
      console.error("견적 전송 실패:", error);
      setError(`견적 전송 중 오류가 발생했습니다: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">견적 요청 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error || !quoteRequest || !device) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="mb-4">
            <svg
              className="w-16 h-16 text-red-500 mx-auto"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">오류 발생</h2>
          <p className="text-gray-600 mb-6">
            {error || "견적 요청 정보를 찾을 수 없습니다."}
          </p>
          <button
            onClick={() => router.back()}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            돌아가기
          </button>
        </div>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("ko-KR").format(amount);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => router.back()}
                className="mr-4 p-2 rounded-md hover:bg-gray-100"
                aria-label="뒤로가기"
              >
                <svg
                  className="w-5 h-5 text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
              <h1 className="text-xl font-bold text-gray-900">견적서 작성</h1>
            </div>
            <span className="text-sm text-gray-500">
              요청자: {quoteRequest.user_profiles?.name || "고객"}님
            </span>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 요청 정보 요약 */}
        <div className="bg-white rounded-lg shadow mb-8 p-6">
          <h2 className="text-lg font-bold mb-4">견적 요청 정보</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-500">요청 기기:</span>
              <p className="font-medium">
                {device.device_name} {device.storage_options[0]}GB
              </p>
            </div>
            <div>
              <span className="text-gray-500">희망 색상:</span>
              <p className="font-medium">
                {quoteRequest.request_details.color === "any"
                  ? "색상무관"
                  : quoteRequest.request_details.color}
              </p>
            </div>
            <div>
              <span className="text-gray-500">데이터 사용량:</span>
              <p className="font-medium">
                {quoteRequest.request_details.dataUsage}
              </p>
            </div>
          </div>
        </div>

        {/* 견적서 작성 폼 */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-bold mb-6">견적 상세 정보</h2>

          <div className="space-y-8">
            {/* 기본 가격 정보 */}
            <section>
              <h3 className="text-md font-semibold mb-4 text-gray-800">
                기본 가격
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    기기 가격 (원) *
                  </label>
                  <input
                    type="number"
                    value={quoteDetails.device_price}
                    onChange={(e) =>
                      handleInputChange(
                        "device_price",
                        parseInt(e.target.value) || 0
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="1200000"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    월 이용료 (원) *
                  </label>
                  <input
                    type="number"
                    value={quoteDetails.monthly_fee}
                    onChange={(e) =>
                      handleInputChange(
                        "monthly_fee",
                        parseInt(e.target.value) || 0
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="65000"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    개통비 (원)
                  </label>
                  <input
                    type="number"
                    value={quoteDetails.activation_fee}
                    onChange={(e) =>
                      handleInputChange(
                        "activation_fee",
                        parseInt(e.target.value) || 0
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    aria-label="개통비"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    약정 기간 (개월)
                  </label>
                  <select
                    value={quoteDetails.contract_period}
                    onChange={(e) =>
                      handleInputChange(
                        "contract_period",
                        parseInt(e.target.value)
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    aria-label="약정 기간"
                  >
                    <option value={24}>24개월</option>
                    <option value={12}>12개월</option>
                    <option value={36}>36개월</option>
                  </select>
                </div>
              </div>
            </section>

            {/* 할인 정보 */}
            <section>
              <h3 className="text-md font-semibold mb-4 text-gray-800">
                할인 혜택
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    기기 할인 (원)
                  </label>
                  <input
                    type="number"
                    value={quoteDetails.device_discount}
                    onChange={(e) =>
                      handleInputChange(
                        "device_discount",
                        parseInt(e.target.value) || 0
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="200000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    요금제 할인 (월/원)
                  </label>
                  <input
                    type="number"
                    value={quoteDetails.plan_discount}
                    onChange={(e) =>
                      handleInputChange(
                        "plan_discount",
                        parseInt(e.target.value) || 0
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="10000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    추가 할인 (원)
                  </label>
                  <input
                    type="number"
                    value={quoteDetails.additional_discount}
                    onChange={(e) =>
                      handleInputChange(
                        "additional_discount",
                        parseInt(e.target.value) || 0
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="50000"
                  />
                </div>
              </div>
            </section>

            {/* 개통 방법 */}
            <section>
              <h3 className="text-md font-semibold mb-4 text-gray-800">
                개통 방법
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    개통 방식
                  </label>
                  <select
                    value={quoteDetails.installation_method}
                    onChange={(e) =>
                      handleInputChange("installation_method", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    aria-label="개통 방식"
                  >
                    <option value="visit">매장 방문</option>
                    <option value="delivery">택배 발송</option>
                    <option value="pickup">퀵 배송</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    배송비 (원)
                  </label>
                  <input
                    type="number"
                    value={quoteDetails.delivery_fee}
                    onChange={(e) =>
                      handleInputChange(
                        "delivery_fee",
                        parseInt(e.target.value) || 0
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    aria-label="배송비"
                    disabled={quoteDetails.installation_method === "visit"}
                  />
                </div>
              </div>
            </section>

            {/* 특별 혜택 */}
            <section>
              <h3 className="text-md font-semibold mb-4 text-gray-800">
                특별 혜택
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  "무료 액세서리",
                  "무료 보험",
                  "데이터 추가 제공",
                  "통화료 할인",
                  "멤버십 혜택",
                  "가족 할인",
                  "학생 할인",
                  "경로 할인",
                ].map((benefit) => (
                  <label
                    key={benefit}
                    className="flex items-center cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={quoteDetails.special_benefits.includes(benefit)}
                      onChange={() => handleBenefitToggle(benefit)}
                      className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      {benefit}
                    </span>
                  </label>
                ))}
              </div>
            </section>

            {/* 매장 메모 */}
            <section>
              <h3 className="text-md font-semibold mb-4 text-gray-800">
                매장 메모
              </h3>
              <textarea
                value={quoteDetails.store_memo}
                onChange={(e) =>
                  handleInputChange("store_memo", e.target.value)
                }
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="고객에게 전달할 추가 메시지나 조건이 있으면 입력해주세요..."
              />
            </section>

            {/* TCO 요약 */}
            <section className="bg-blue-50 p-6 rounded-lg">
              <h3 className="text-lg font-bold mb-4 text-blue-900">
                총 비용 요약 (TCO)
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-blue-700">기기 비용:</span>
                  <p className="font-bold text-blue-900">
                    {formatCurrency(
                      Math.max(
                        0,
                        quoteDetails.device_price - quoteDetails.device_discount
                      )
                    )}
                    원
                  </p>
                </div>
                <div>
                  <span className="text-blue-700">요금제 비용:</span>
                  <p className="font-bold text-blue-900">
                    {formatCurrency(
                      (quoteDetails.monthly_fee - quoteDetails.plan_discount) *
                        quoteDetails.contract_period
                    )}
                    원
                  </p>
                </div>
                <div>
                  <span className="text-blue-700">기타 비용:</span>
                  <p className="font-bold text-blue-900">
                    {formatCurrency(
                      quoteDetails.activation_fee + quoteDetails.delivery_fee
                    )}
                    원
                  </p>
                </div>
                <div className="border-l-2 border-blue-300 pl-4">
                  <span className="text-blue-700">총 비용:</span>
                  <p className="font-bold text-xl text-blue-900">
                    {formatCurrency(quoteDetails.tco_24months)}원
                  </p>
                </div>
              </div>
            </section>
          </div>

          {/* 제출 버튼 */}
          <div className="mt-8 flex justify-end space-x-4">
            <button
              onClick={() => router.back()}
              className="px-6 py-3 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            >
              취소
            </button>
            <button
              onClick={handleSubmit}
              disabled={
                submitting ||
                quoteDetails.device_price <= 0 ||
                quoteDetails.monthly_fee <= 0
              }
              className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? "전송 중..." : "견적서 전송"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
