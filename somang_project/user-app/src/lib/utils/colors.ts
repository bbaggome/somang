// /src/lib/utils/colors.ts
/**
 * 디바이스 색상을 Tailwind CSS 클래스로 변환하는 유틸리티
 */
export function getColorClasses(color: string): string {
  const colorMap: { [key: string]: string } = {
    // 티타늄 계열
    'Titanium Black': 'bg-gray-900 border-gray-700',
    'Titanium Gray': 'bg-gray-500 border-gray-400',
    'Titanium Violet': 'bg-purple-600 border-purple-500',
    'Titanium Yellow': 'bg-yellow-400 border-yellow-300',
    'Natural Titanium': 'bg-gray-300 border-gray-200',
    
    // 기본 색상
    'Black': 'bg-black border-gray-800',
    'White': 'bg-white border-gray-300',
    'Blue': 'bg-blue-500 border-blue-400',
    'Pink': 'bg-pink-500 border-pink-400',
    'Green': 'bg-green-500 border-green-400',
    'Red': 'bg-red-500 border-red-400',
    'Purple': 'bg-purple-500 border-purple-400',
    'Yellow': 'bg-yellow-500 border-yellow-400',
    
    // iPhone 색상
    'Space Gray': 'bg-gray-700 border-gray-600',
    'Silver': 'bg-gray-200 border-gray-100',
    'Gold': 'bg-yellow-300 border-yellow-200',
    'Rose Gold': 'bg-pink-300 border-pink-200',
    'Midnight': 'bg-gray-900 border-gray-800',
    'Starlight': 'bg-gray-100 border-gray-50',
    'Product Red': 'bg-red-600 border-red-500',
    'Alpine Green': 'bg-green-600 border-green-500',
    'Sierra Blue': 'bg-blue-400 border-blue-300',
    
    // 삼성 색상
    'Phantom Black': 'bg-gray-900 border-gray-800',
    'Phantom Silver': 'bg-gray-300 border-gray-200',
    'Phantom Violet': 'bg-purple-500 border-purple-400',
    'Phantom Pink': 'bg-pink-400 border-pink-300',
    'Cream': 'bg-yellow-100 border-yellow-50',
    'Lavender': 'bg-purple-200 border-purple-100',
    'Mint': 'bg-green-200 border-green-100',
    'Graphite': 'bg-gray-600 border-gray-500',
  };
  
  return colorMap[color] || 'bg-gray-300 border-gray-200';
}

/**
 * 색상 이름을 한글로 변환
 */
export function getColorNameInKorean(color: string): string {
  const koreanNames: { [key: string]: string } = {
    'Titanium Black': '티타늄 블랙',
    'Titanium Gray': '티타늄 그레이',
    'Titanium Violet': '티타늄 바이올렛',
    'Titanium Yellow': '티타늄 옐로우',
    'Natural Titanium': '내추럴 티타늄',
    'Black': '블랙',
    'White': '화이트',
    'Blue': '블루',
    'Pink': '핑크',
    'Green': '그린',
    'Red': '레드',
    'Purple': '퍼플',
    'Yellow': '옐로우',
    'Space Gray': '스페이스 그레이',
    'Silver': '실버',
    'Gold': '골드',
    'Rose Gold': '로즈 골드',
    'Midnight': '미드나이트',
    'Starlight': '스타라이트',
    'Product Red': '프로덕트 레드',
    'Alpine Green': '알파인 그린',
    'Sierra Blue': '시에라 블루',
    'Phantom Black': '팬텀 블랙',
    'Phantom Silver': '팬텀 실버',
    'Phantom Violet': '팬텀 바이올렛',
    'Phantom Pink': '팬텀 핑크',
    'Cream': '크림',
    'Lavender': '라벤더',
    'Mint': '민트',
    'Graphite': '그래파이트',
  };
  
  return koreanNames[color] || color;
}