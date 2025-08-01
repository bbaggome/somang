interface LoadingOverlayProps {
  isVisible: boolean;
  message?: string;
}

export default function LoadingOverlay({ isVisible, message = "로딩 중..." }: LoadingOverlayProps) {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl p-8 shadow-2xl flex flex-col items-center justify-center min-w-[200px]">
        {/* 스피너 */}
        <div className="relative">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200"></div>
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent absolute top-0 left-0"></div>
        </div>
        
        {/* 로딩 메시지 */}
        <p className="text-gray-700 font-medium mt-4">{message}</p>
        
        {/* 프로그레스 바 애니메이션 */}
        <div className="w-full bg-gray-200 rounded-full h-1 mt-4 overflow-hidden">
          <div className="bg-blue-600 h-1 rounded-full animate-pulse w-3/4"></div>
        </div>
      </div>
    </div>
  );
}