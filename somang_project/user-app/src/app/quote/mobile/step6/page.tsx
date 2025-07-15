// /src/app/quote/mobile/step6/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuote } from '@/context/QuoteContext';
import { supabase } from '@/lib/supabase/client';

interface Device {
  id: string;
  manufacturer: string;
  device_name: string;
  device_code: string;
  storage_options: number[];
  colors: string[];
  ram_gb: number;
  battery_mah: number;
  screen_size_inch: number;
  display_spec: string;
  camera_spec: string;
}

export default function MobileQuoteStep6Page() {
  const router = useRouter();
  const { quoteData, updateQuoteData } = useQuote();
  const [devices, setDevices] = useState<Device[]>([]);
  const [filteredDevices, setFilteredDevices] = useState<Device[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [selectedTag, setSelectedTag] = useState('premium');
  const [loading, setLoading] = useState(true);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [selectedColor, setSelectedColor] = useState('');
  const [colorAgnostic, setColorAgnostic] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // 디바이스 목록 로드
  useEffect(() => {
    loadDevices();
  }, []);

  // 필터링 로직
  useEffect(() => {
    filterDevices();
  }, [devices, searchTerm, selectedFilter, selectedTag]);

  const loadDevices = async () => {
    try {
      const { data, error } = await supabase
        .from('devices')
        .select('*')
        .is('deleted_at', null)
        .order('device_name');

      if (error) throw error;
      setDevices(data || []);
    } catch (error) {
      console.error('디바이스 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterDevices = () => {
    let filtered = [...devices];

    // 검색어 필터
    if (searchTerm) {
      filtered = filtered.filter(device => 
        device.device_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        device.device_code.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // 제조사 필터
    if (selectedFilter !== 'all') {
      filtered = filtered.filter(device => {
        switch (selectedFilter) {
          case 'samsung':
            return device.manufacturer.toLowerCase() === 'samsung';
          case 'apple':
            return device.manufacturer.toLowerCase() === 'apple';
          case '5g':
            return device.device_name.includes('5G');
          case 'lte':
            return !device.device_name.includes('5G');
          default:
            return true;
        }
      });
    }

    // 태그 필터 (예시)
    if (selectedTag === 'premium') {
      filtered = filtered.filter(device => 
        device.device_name.includes('Ultra') || 
        device.device_name.includes('Pro') || 
        device.device_name.includes('Fold')
      );
    }

    setFilteredDevices(filtered);
  };

  const handleDeviceSelect = (device: Device) => {
    setSelectedDevice(device);
    setSelectedColor('');
    setColorAgnostic(false);
    setShowModal(true);
  };

  const handleConfirmSelection = () => {
    if (!selectedDevice || (!selectedColor && !colorAgnostic)) return;

    // Context에 데이터 저장
    updateQuoteData({
      deviceId: selectedDevice.id,
      color: colorAgnostic ? 'any' : selectedColor
    });
    
    // URL 파라미터 없이 이동
    router.push('/quote/mobile/step7');
  };

  const getColorClasses = (color: string) => {
    // 색상 이름을 Tailwind 클래스로 매핑
    const colorMap: { [key: string]: string } = {
      'Titanium Black': 'bg-gray-900 border-gray-700',
      'Titanium Gray': 'bg-gray-500 border-gray-400',
      'Titanium Violet': 'bg-purple-600 border-purple-500',
      'Titanium Yellow': 'bg-yellow-400 border-yellow-300',
      'Natural Titanium': 'bg-gray-300 border-gray-200',
      'Black': 'bg-black border-gray-800',
      'White': 'bg-white border-gray-300',
      'Blue': 'bg-blue-500 border-blue-400',
      'Pink': 'bg-pink-500 border-pink-400',
      'Green': 'bg-green-500 border-green-400',
    };
    return colorMap[color] || 'bg-gray-300 border-gray-200';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center">
      <div className="w-full max-w-[500px] min-h-screen bg-white shadow-xl overflow-hidden flex flex-col">
        {/* 헤더 */}
        <header className="p-4 flex items-center justify-center relative flex-shrink-0 border-b border-gray-100">
          <button 
            className="absolute left-4 top-1/2 -translate-y-1/2" 
            aria-label="뒤로가기" 
            onClick={() => router.back()}
          >
            <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-lg font-bold text-gray-800">휴대폰 견적 받아보기</h1>
        </header>

        {/* 진행 상태 바 - 5/8 (62.5%) */}
        <div className="w-full bg-gray-200 h-1 flex-shrink-0">
          <div className="bg-blue-600 h-1 transition-all duration-500 w-[62.5%]" />
        </div>

        {/* 메인 컨텐츠 */}
        <main className="flex-grow flex flex-col min-h-0">
          <div className="p-6 flex-shrink-0">
            <h2 className="text-2xl font-bold text-gray-800">
              구매를 원하는<br />휴대폰을 선택해주세요!
            </h2>
            
            {/* 검색 바 */}
            <div className="mt-4 relative">
              <input 
                type="text" 
                placeholder="원하는 모델을 검색해보세요"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full py-3 pl-4 pr-10 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <svg className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          <div className="px-6 pb-4 flex-shrink-0">
            {/* 태그 필터 */}
            <div className="flex space-x-2 overflow-x-auto pb-2 -mx-6 px-6">
              <button 
                onClick={() => setSelectedTag('premium')}
                className={`filter-chip flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  selectedTag === 'premium' 
                    ? 'bg-blue-100 text-blue-600 font-bold' 
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                #최상위 프리미엄폰
              </button>
              <button 
                onClick={() => setSelectedTag('value')}
                className={`filter-chip flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  selectedTag === 'value' 
                    ? 'bg-blue-100 text-blue-600 font-bold' 
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                #가성비 끝판왕폰
              </button>
              <button 
                onClick={() => setSelectedTag('senior')}
                className={`filter-chip flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  selectedTag === 'senior' 
                    ? 'bg-blue-100 text-blue-600 font-bold' 
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                #효도폰
              </button>
            </div>

            {/* 제조사 필터 */}
            <div className="mt-4 flex justify-between items-center border-b border-gray-200">
              <div className="flex space-x-6">
                {[
                  { value: 'all', label: '전체' },
                  { value: 'samsung', label: '삼성' },
                  { value: 'apple', label: '애플' },
                  { value: '5g', label: '5G' },
                  { value: 'lte', label: 'LTE' }
                ].map((filter) => (
                  <button 
                    key={filter.value}
                    onClick={() => setSelectedFilter(filter.value)}
                    className={`py-2 text-gray-600 border-b-2 transition-all ${
                      selectedFilter === filter.value 
                        ? 'text-blue-600 font-bold border-blue-600' 
                        : 'border-transparent'
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 디바이스 목록 */}
          <div className="flex-grow overflow-y-auto px-6 space-y-4 pb-6">
            {loading ? (
              <div className="text-center py-10">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-500">로딩 중...</p>
              </div>
            ) : filteredDevices.length === 0 ? (
              <div className="text-center py-10 text-gray-500">
                <p className="text-4xl mb-4">📱</p>
                <p>조건에 맞는 상품이 없습니다.</p>
              </div>
            ) : (
              filteredDevices.map((device) => (
                <div 
                  key={device.id}
                  onClick={() => handleDeviceSelect(device)}
                  className="bg-white border border-gray-200 rounded-xl p-4 flex space-x-4 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                >
                  <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-3xl">📱</span>
                  </div>
                  <div className="flex-grow">
                    <h3 className="font-bold text-lg">
                      {device.device_name} {device.storage_options[0]}GB
                    </h3>
                    <p className="text-xs text-gray-400 font-mono mt-1">{device.device_code}</p>
                    <div className="flex space-x-2 mt-2">
                      {device.colors.slice(0, 3).map((color, index) => (
                        <span 
                          key={index}
                          className={`w-4 h-4 rounded-full border-2 ${getColorClasses(color)}`}
                        />
                      ))}
                      {device.colors.length > 3 && (
                        <span className="text-xs text-gray-500">+{device.colors.length - 3}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </main>
      </div>

      {/* 디바이스 상세 모달 */}
      {showModal && selectedDevice && (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-end justify-center">
          <div className="w-full max-w-[500px] bg-white rounded-t-3xl transform transition-transform duration-300">
            <div className="p-6 overflow-y-auto max-h-[80vh]">
              {/* 디바이스 정보 */}
              <div className="bg-white rounded-xl p-4 flex space-x-4">
                <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-3xl">📱</span>
                </div>
                <div className="flex-grow">
                  <h3 className="font-bold text-lg">
                    {selectedDevice.device_name} {selectedDevice.storage_options[0]}GB
                  </h3>
                  <p className="text-xs text-gray-400 font-mono mt-1">{selectedDevice.device_code}</p>
                </div>
              </div>

              {/* 스펙 정보 */}
              <div className="mt-4 bg-gray-50 p-4 rounded-lg grid grid-cols-3 gap-y-4">
                <div className="text-center">
                  <p className="text-xs text-gray-500">RAM</p>
                  <p className="font-bold text-sm">{selectedDevice.ram_gb}GB</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500">배터리</p>
                  <p className="font-bold text-sm">{selectedDevice.battery_mah}mAh</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500">화면크기</p>
                  <p className="font-bold text-sm">{selectedDevice.screen_size_inch}인치</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500">디스플레이</p>
                  <p className="font-bold text-xs">{selectedDevice.display_spec}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500">카메라</p>
                  <p className="font-bold text-xs">{selectedDevice.camera_spec}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500">내장메모리</p>
                  <p className="font-bold text-sm">{selectedDevice.storage_options[0]}GB</p>
                </div>
              </div>

              {/* 색상 선택 */}
              <div className="mt-6">
                <h4 className="font-bold">선택한 모델의 색상을 선택해주세요!</h4>
                <div className="mt-3 flex items-center justify-between">
                  <div className="flex space-x-3">
                    {selectedDevice.colors.map((color) => (
                      <div
                        key={color}
                        onClick={() => {
                          setSelectedColor(color);
                          setColorAgnostic(false);
                        }}
                        className={`w-10 h-10 rounded-full border-2 cursor-pointer transition-all ${
                          selectedColor === color 
                            ? 'ring-2 ring-offset-2 ring-blue-600' 
                            : ''
                        } ${getColorClasses(color)}`}
                      />
                    ))}
                  </div>
                  <label className="flex items-center text-sm cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={colorAgnostic}
                      onChange={(e) => {
                        setColorAgnostic(e.target.checked);
                        if (e.target.checked) setSelectedColor('');
                      }}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
                    />
                    색상상관없음
                  </label>
                </div>
              </div>
            </div>

            {/* 하단 버튼 */}
            <footer className="p-4 bg-white border-t border-gray-100 flex items-center justify-between flex-shrink-0">
              <button
                onClick={() => setShowModal(false)}
                className="w-1/3 bg-gray-200 text-gray-700 py-3 rounded-lg font-bold hover:bg-gray-300"
              >
                돌아가기
              </button>
              <button
                onClick={handleConfirmSelection}
                disabled={!selectedColor && !colorAgnostic}
                className={`w-2/3 ml-3 py-3 rounded-lg font-bold transition ${
                  selectedColor || colorAgnostic
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-400 text-gray-200 cursor-not-allowed'
                }`}
              >
                모델 선택하기
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}