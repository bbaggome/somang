'use client';

import { useState, useRef, ChangeEvent, FormEvent, ReactNode } from 'react';
import { supabase } from '@/lib/supabase/client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// Helper Components
const SectionHeader = ({ title, description }: { title: string; description?: string }) => (
  <div className="pb-4 border-b border-gray-200 mb-6"><h3 className="text-lg font-bold text-gray-800">{title}</h3>{description && <p className="text-sm text-gray-500 mt-1">{description}</p>}</div>
);
const Field = ({ label, children, required = false, id }: { label: string; children: ReactNode; required?: boolean; id?: string }) => (
  <div className="grid grid-cols-1 md:grid-cols-4 gap-2 items-start pt-2"><label htmlFor={id} className="text-sm font-semibold text-gray-700 md:col-span-1 mt-2">{label} {required && <span className="text-red-500">*</span>}</label><div className="md:col-span-3">{children}</div></div>
);
const ToggleButtonGroup = ({ options, selected, onSelect, multiSelect = false }: { options: string[], selected: string | string[], onSelect: (value: string) => void, multiSelect?: boolean }) => (
  <div className="flex flex-wrap gap-2">{options.map((option) => { const isSelected = multiSelect ? (selected as string[]).includes(option) : selected === option; return (<button type="button" key={option} onClick={() => onSelect(option)} className={`px-4 py-2 text-sm font-semibold border rounded-md transition-colors ${isSelected ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'}`}>{option}</button>)})}</div>
);

// Daum Postcode 타입 정의
declare global {
  interface Window {
    daum: {
      Postcode: new (options: {
        oncomplete: (data: {
          zonecode: string;
          address: string;
        }) => void;
      }) => {
        open: () => void;
      };
    };
  }
}

/**
 * 랜덤 닉네임을 생성하는 함수
 * @returns {string} "형용사 + 명사 + 숫자" 형태의 랜덤 닉네임
 */
const generateRandomName = () => {
    const adjectives = ["용감한", "슬기로운", "친절한", "빛나는", "행복한", "성실한", "고요한"];
    const nouns = ["호랑이", "독수리", "사자", "돌고래", "거북이", "기린", "다람쥐"];
    const randomNumber = Math.floor(Math.random() * 1000);
    const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    return `${adjective}${noun}${randomNumber}`;
};

export default function BizSignupPage() {
  const [formData, setFormData] = useState({
    storeType: '',
    businessMethods: [] as string[],
    businessName: '', // 사업자상호명 (기존)
    bizName: '', // 매장 상호명 (신규 추가)
    storePhone: '',
    businessRegNumber: '',
    preApprovalNumber: '',
    email: '',
    password: '',
    passwordConfirm: '',
    sellerName: '',
    sellerPhone: '',
    zipCode: '',
    address: '',
    addressDetail: '',
    latitude: null as number | null,
    longitude: null as number | null,
    agreeTerms: false,
    agreePrivacy: false,
  });
  const [businessRegFile, setBusinessRegFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setBusinessRegFile(e.target.files[0]);
    }
  };

  const getCoordinates = async (address: string) => {
    try {
      const response = await fetch(
        `https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(address)}`,
        {
          headers: {
            Authorization: `KakaoAK ${process.env.NEXT_PUBLIC_KAKAO_REST_API_KEY}`,
          },
        }
      );
      const data = await response.json();
      if (data.documents && data.documents.length > 0) {
        const { x, y } = data.documents[0];
        setFormData(prev => ({ ...prev, longitude: parseFloat(x), latitude: parseFloat(y) }));
        console.log('Set coordinates:', { longitude: x, latitude: y });
      }
    } catch (error) {
      console.error("주소 좌표 변환 실패:", error);
      alert("주소 좌표를 가져오는데 실패했습니다. 네트워크 상태를 확인하거나 주소를 다시 확인해주세요.");
    }
  };

  const handleAddressSearch = () => {
    if (window.daum) {
      new window.daum.Postcode({
        oncomplete: (data: { zonecode: string; address: string }) => {
          setFormData(prev => ({
            ...prev,
            zipCode: data.zonecode,
            address: data.address,
          }));
          getCoordinates(data.address);
        },
      }).open();
    }
  };
  
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    // 유효성 검사
    if (formData.password !== formData.passwordConfirm) { alert('비밀번호가 일치하지 않습니다.'); return; }
    if (!businessRegFile) { alert('사업자등록증 파일을 첨부해주세요.'); return; }
    if (!formData.agreeTerms || !formData.agreePrivacy) { alert('필수 약관에 모두 동의해주세요.'); return; }
    if (!formData.latitude || !formData.longitude) {
      alert("매장 주소의 좌표를 가져올 수 없습니다. 주소 검색을 다시 시도해주세요.");
      return;
    }
    
    setIsSubmitting(true);
    try {
      // 랜덤 닉네임 생성
      const nickName = generateRandomName();

      // 1. 사용자 계정 생성
      const { data: { user }, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        phone: formData.storePhone,
        options: { 
          data: { 
            name: nickName, // 랜덤 닉네임 사용
            role: 'owner'
          } 
        }
      });
      if (authError) throw authError;
      if (!user) throw new Error('User creation failed.');

      // 2. 사업자등록증 파일 업로드
      const fileExt = businessRegFile.name.split('.').pop();
      const fileName = `${user.id}-${new Date().getTime()}.${fileExt}`;
      const filePath = `store-verification-docs/${fileName}`;
      const { error: uploadError } = await supabase.storage.from('stores').upload(filePath, businessRegFile);
      if (uploadError) throw uploadError;

      // 3. 업로드된 파일 URL 가져오기
      const { data: { publicUrl } } = supabase.storage.from('stores').getPublicUrl(filePath);

      // 4. DB 함수(RPC) 호출로 모든 정보 저장 (biz_name 파라미터 추가)
      const { error: rpcError } = await supabase.rpc('handle_biz_signup', {
        p_user_id: user.id,
        p_store_type: formData.storeType,
        p_business_methods: formData.businessMethods,        
        p_name: formData.businessName, // 사업자상호명
        p_biz_name: formData.bizName, // 매장 상호명 (신규 추가)
        p_phone_number: formData.storePhone,
        p_business_registration_number: formData.businessRegNumber,
        p_pre_approval_number: formData.preApprovalNumber,
        p_zip_code: formData.zipCode,
        p_base_address: formData.address,
        p_detail_address: formData.addressDetail,
        p_document_file_url: publicUrl,
        p_seller_phone_number: formData.sellerPhone,
        p_latitude: formData.latitude,
        p_longitude: formData.longitude,
        p_seller_name: formData.sellerName,
      });
      if (rpcError) throw rpcError;

      alert('T-Bridge 파트너 가입 신청이 성공적으로 완료되었습니다. 로그인 페이지로 이동합니다.');
      router.push('/');
    } catch (error: unknown) {
      console.error('Signup process error:', error);
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
      alert(`오류가 발생했습니다: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex justify-center items-start p-4 sm:p-8">
      <div className="w-full max-w-4xl bg-white rounded-lg shadow-lg p-8">
        <header className="mb-8 text-center">
          <h1 className="text-2xl font-black text-blue-600 mb-2">
            T-BRIDGE 파트너 가입
          </h1>
          <p className="text-gray-500">
            T-Bridge와 함께 새로운 비즈니스 기회를 만들어보세요.
          </p>
        </header>
        <form onSubmit={handleSubmit} className="space-y-10">
          <section>
            <SectionHeader title="매장 기본 정보" />
            <div className="space-y-4">
              <Field label="매장 구분" required>
                <ToggleButtonGroup
                  options={[
                    "판매점",
                    "도매매",
                    "대리점",
                    "직영점",
                    "양판점",
                    "기타",
                  ]}
                  selected={formData.storeType}
                  onSelect={(v) => setFormData((p) => ({ ...p, storeType: v }))}
                />
              </Field>
              <Field label="영업 방식" required>
                <p className="text-xs text-gray-500 mb-2">중복 선택 가능</p>
                <ToggleButtonGroup
                  options={["매장", "온라인", "특판", "TM-방판", "기타"]}
                  selected={formData.businessMethods}
                  onSelect={(v) => {
                    const newMethods = formData.businessMethods.includes(v)
                      ? formData.businessMethods.filter((m) => m !== v)
                      : [...formData.businessMethods, v];
                    setFormData((p) => ({ ...p, businessMethods: newMethods }));
                  }}
                  multiSelect
                />
              </Field>
            </div>
          </section>
          <section>
            <SectionHeader title="사업자 정보" />
            <div className="space-y-4">
              <Field label="사업자상호명" id="businessName" required>
                <input
                  id="businessName"
                  name="businessName"
                  value={formData.businessName}
                  onChange={handleInputChange}
                  className="w-full form-input"
                  placeholder="사업자등록증 상의 상호명을 입력하세요"
                  required
                />
              </Field>
              {/* 신규 추가: 매장 상호명 필드 */}
              <Field label="매장 상호명" id="bizName" required>
                <input
                  id="bizName"
                  name="bizName"
                  value={formData.bizName}
                  onChange={handleInputChange}
                  className="w-full form-input"
                  placeholder="실제 운영하는 매장의 상호명을 입력하세요"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  고객에게 표시될 매장명입니다. (예: OO모바일, XX통신)
                </p>
              </Field>
              <Field label="매장 연락처" id="storePhone" required>
                <input
                  id="storePhone"
                  name="storePhone"
                  type="tel"
                  value={formData.storePhone}
                  onChange={handleInputChange}
                  className="w-full form-input"
                  placeholder="'-' 없이 숫자만 입력"
                  required
                />
              </Field>
              <Field label="사업자등록번호" id="businessRegNumber" required>
                <input
                  id="businessRegNumber"
                  name="businessRegNumber"
                  value={formData.businessRegNumber}
                  onChange={handleInputChange}
                  className="w-full form-input"
                  placeholder="'-' 없이 숫자만 입력"
                  required
                />
              </Field>
              <Field label="사업자등록증" required>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={businessRegFile?.name || ""}
                    readOnly
                    placeholder="파일을 선택하세요"
                    className="w-full form-input bg-gray-100"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="btn-secondary whitespace-nowrap"
                  >
                    파일 찾기
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept="image/*,.pdf"
                    placeholder="사업자등록증 파일을 선택하세요"
                    required
                  />
                </div>
              </Field>
              <Field label="사전승낙번호" id="preApprovalNumber">
                <input
                  id="preApprovalNumber"
                  name="preApprovalNumber"
                  value={formData.preApprovalNumber}
                  onChange={handleInputChange}
                  className="w-full form-input"
                  placeholder="사전승낙번호가 있는 경우 입력하세요"
                />
              </Field>
            </div>
          </section>
          <section>
            <SectionHeader
              title="계정 정보"
              description="파트너 로그인 시 사용할 계정 정보를 입력해주세요."
            />
            <div className="space-y-4">
              <Field label="아이디 (이메일)" id="email" required>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full form-input"
                  placeholder="파트너 로그인 아이디로 사용할 이메일을 입력하세요"
                  required
                />
              </Field>
              <Field label="비밀번호" id="password" required>
                <input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full form-input"
                  placeholder="비밀번호는 8자 이상이어야 합니다"
                  required
                />
              </Field>
              <Field label="비밀번호 확인" id="passwordConfirm" required>
                <input
                  id="passwordConfirm"
                  name="passwordConfirm"
                  type="password"
                  value={formData.passwordConfirm}
                  onChange={handleInputChange}
                  className="w-full form-input"
                  placeholder="비밀번호를 다시 입력하세요"
                  required
                />
              </Field>
            </div>
          </section>

          <section>
            <SectionHeader title="판매자 정보" />
            <div className="space-y-4">
              <Field label="판매자명" id="sellerName" required>
                <input
                  id="sellerName"
                  name="sellerName"
                  value={formData.sellerName}
                  onChange={handleInputChange}
                  className="w-full form-input"
                  placeholder="판매자 이름을 입력하세요"
                  required
                />
              </Field>
              <Field label="판매자 연락처" id="sellerPhone" required>
                <input
                  id="sellerPhone"
                  name="sellerPhone"
                  type="tel"
                  value={formData.sellerPhone}
                  onChange={handleInputChange}
                  className="w-full form-input"
                  placeholder="'-' 없이 숫자만 입력"
                  required
                />
              </Field>
              <Field label="매장주소" required>
                <div className="flex items-center gap-2 mb-2">
                  <input
                    name="zipCode"
                    value={formData.zipCode}
                    placeholder="우편번호"
                    readOnly
                    className="w-32 form-input bg-gray-100"
                  />
                  <button
                    type="button"
                    onClick={handleAddressSearch}
                    className="btn-secondary whitespace-nowrap"
                  >
                    주소 검색
                  </button>
                </div>
                <input
                  name="address"
                  value={formData.address}
                  placeholder="기본주소"
                  readOnly
                  className="w-full form-input bg-gray-100 mb-2"
                />
                <input
                  name="addressDetail"
                  value={formData.addressDetail}
                  onChange={handleInputChange}
                  placeholder="상세주소를 입력하세요"
                  className="w-full form-input"
                />
              </Field>
            </div>
          </section>

          <section>
            <SectionHeader title="약관 동의" />
            <div className="space-y-3 p-4 border rounded-md">
              <label
                htmlFor="agreeAll"
                className="flex items-center font-bold cursor-pointer mb-4 pb-2 border-b"
              >
                <input
                  id="agreeAll"
                  type="checkbox"
                  checked={formData.agreeTerms && formData.agreePrivacy}
                  onChange={(e) =>
                    setFormData((p) => ({
                      ...p,
                      agreeTerms: e.target.checked,
                      agreePrivacy: e.target.checked,
                    }))
                  }
                  className="mr-2 h-5 w-5"
                />
                모든 약관에 동의합니다.
              </label>
              <label
                htmlFor="agreeTerms"
                className="flex items-center justify-between text-sm cursor-pointer"
              >
                <span className="flex items-center">
                  <input
                    id="agreeTerms"
                    type="checkbox"
                    name="agreeTerms"
                    checked={formData.agreeTerms}
                    onChange={handleInputChange}
                    className="mr-2 h-4 w-4"
                  />
                  [필수] 이용약관 동의
                </span>
                <a
                  href="#"
                  className="text-blue-600 hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  전문보기
                </a>
              </label>
              <label
                htmlFor="agreePrivacy"
                className="flex items-center justify-between text-sm cursor-pointer"
              >
                <span className="flex items-center">
                  <input
                    id="agreePrivacy"
                    type="checkbox"
                    name="agreePrivacy"
                    checked={formData.agreePrivacy}
                    onChange={handleInputChange}
                    className="mr-2 h-4 w-4"
                  />
                  [필수] 개인정보보호정책 동의
                </span>
                <a
                  href="#"
                  className="text-blue-600 hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  전문보기
                </a>
              </label>
            </div>
          </section>

          <div className="flex justify-center items-center gap-4 pt-8">
            <Link
              href="/"
              className="btn-secondary w-40 text-center"
            >
              취소
            </Link>
            <button
              type="submit"
              className="btn-primary w-40"
              disabled={isSubmitting}
            >
              {isSubmitting ? "신청 중..." : "가입"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}