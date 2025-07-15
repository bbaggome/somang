// /src/components/ProgressBar.tsx
interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
  className?: string;
}

export default function ProgressBar({ 
  currentStep, 
  totalSteps, 
  className = "" 
}: ProgressBarProps) {
  const percentage = (currentStep / totalSteps) * 100;
  
  return (
    <div className={`w-full bg-gray-200 h-1 flex-shrink-0 ${className}`}>
      <div 
        className="bg-blue-600 h-1 transition-all duration-500 ease-out"
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}

// 사용 예시 컴포넌트
export function ProgressBarWithLabel({ 
  currentStep, 
  totalSteps,
  label 
}: ProgressBarProps & { label?: string }) {
  return (
    <div className="w-full">
      {label && (
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>{label}</span>
          <span>{currentStep}/{totalSteps}</span>
        </div>
      )}
      <ProgressBar currentStep={currentStep} totalSteps={totalSteps} />
    </div>
  );
}