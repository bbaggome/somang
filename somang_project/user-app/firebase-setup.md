# Firebase FCM 설정 가이드

## 1. Firebase Console 설정
1. https://console.firebase.google.com/ 접속
2. 새 프로젝트 생성 또는 기존 프로젝트 선택
3. 'Android 앱 추가' 클릭
4. Android 패키지명: `com.tbridge.userapp` 입력
5. google-services.json 다운로드

## 2. google-services.json 파일 배치
다운로드한 `google-services.json` 파일을 다음 위치에 복사:
```
C:\Works\somang\somang\somang_project\user-app\android\app\google-services.json
```

## 3. Firebase SDK 추가 (이미 완료됨)
- AndroidManifest.xml에 FCM 서비스 추가 완료
- strings.xml에 알림 채널 설정 완료
- Capacitor Push Notifications 플러그인 설치 완료

## 4. Firebase 프로젝트 설정
1. Firebase Console > 프로젝트 설정 > Cloud Messaging
2. Server key 복사 (Supabase Edge Function에서 사용)
3. Sender ID 확인

## 5. 테스트 방법
1. APK 빌드 후 실제 기기에 설치
2. 앱에서 알림 권한 허용
3. Firebase Console > Cloud Messaging > 첫 번째 캠페인에서 테스트 알림 전송

## 필요한 다음 단계
- Java JDK 설치
- Android Studio 설치 또는 Gradle 빌드 환경 구성
- 실제 기기에서 APK 테스트