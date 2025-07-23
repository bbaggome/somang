# 앱 아이콘 및 스플래시 스크린 가이드

## 아이콘 요구사항
- **icon.png**: 1024x1024px, PNG 형식, 투명 배경 없음
- Android와 iOS 모든 크기의 아이콘이 자동 생성됨

## 스플래시 스크린 요구사항  
- **splash.png**: 2732x2732px, PNG 형식
- 중앙에 로고 배치 (안전 영역: 중앙 1200x1200px)
- 배경색은 단색 권장

## 아이콘 생성 방법
1. 1024x1024px 크기의 앱 아이콘 디자인
2. `resources/icon.png`로 저장
3. 다음 명령 실행:
   ```bash
   npm install -g @capacitor/assets
   npx capacitor-assets generate
   ```

## 현재 상태
- 임시 placeholder 파일 생성 완료
- 실제 디자인 파일로 교체 필요

## 디자인 권장사항
- T-Bridge 브랜드 색상 사용
- 심플하고 인식하기 쉬운 디자인
- 작은 크기에서도 명확히 보이는 형태