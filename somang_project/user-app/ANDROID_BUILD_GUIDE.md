# Android APK 빌드 가이드

## 1. Android Studio에서 프로젝트 열기 ✅
`npx cap open android` 명령으로 Android Studio가 열렸습니다.

## 2. Android Studio 초기 설정

### Gradle Sync
1. Android Studio가 열리면 자동으로 Gradle sync가 시작됩니다
2. 하단의 "Build" 탭에서 진행 상황 확인
3. 첫 실행 시 필요한 SDK 다운로드가 진행될 수 있습니다 (5-10분 소요)

### SDK 설정 확인
- File → Project Structure → SDK Location
- Android SDK가 설정되어 있는지 확인

## 3. Firebase 설정 (FCM Push 알림용)

### google-services.json 추가
1. Firebase Console (https://console.firebase.google.com/) 접속
2. 프로젝트 생성 또는 선택
3. "Android 앱 추가" 클릭
4. Android 패키지명: `com.tbridge.userapp` 입력
5. "앱 등록" 클릭
6. `google-services.json` 다운로드
7. 다운로드한 파일을 복사:
   ```
   C:\Works\somang\somang\somang_project\user-app\android\app\google-services.json
   ```

## 4. APK 빌드

### 방법 1: Android Studio UI에서 빌드
1. 상단 메뉴: Build → Build Bundle(s) / APK(s) → Build APK(s)
2. 빌드가 완료되면 우측 하단에 알림 표시
3. "locate" 클릭하여 APK 위치 확인

### 방법 2: 터미널에서 빌드
```bash
cd C:\Works\somang\somang\somang_project\user-app\android
.\gradlew assembleDebug
```

### APK 위치
```
C:\Works\somang\somang\somang_project\user-app\android\app\build\outputs\apk\debug\app-debug.apk
```

## 5. 실제 기기에서 테스트

### USB 디버깅 활성화 (Android 폰)
1. 설정 → 휴대전화 정보
2. "빌드 번호" 7번 탭
3. 개발자 옵션 활성화됨
4. 설정 → 개발자 옵션 → USB 디버깅 ON

### APK 설치
1. USB로 폰 연결
2. Android Studio에서 Run 버튼 클릭
3. 또는 APK 파일을 직접 전송하여 설치

## 6. 빌드 문제 해결

### Gradle sync 실패 시
1. File → Invalidate Caches and Restart
2. Build → Clean Project
3. Build → Rebuild Project

### google-services.json 오류
- 파일이 `android/app/` 폴더에 있는지 확인
- Firebase 프로젝트의 패키지명이 `com.tbridge.userapp`인지 확인

### 메모리 부족 오류
gradle.properties 파일에 추가:
```
org.gradle.jvmargs=-Xmx4096m
```

## 7. 릴리스 빌드 (배포용)

### 서명 키 생성
```bash
keytool -genkey -v -keystore my-release-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias my-key-alias
```

### 릴리스 빌드
1. Build → Generate Signed Bundle / APK
2. APK 선택
3. 키스토어 정보 입력
4. Release 선택
5. Build

---

## 현재 상태
- ✅ Java JDK 설치 완료
- ✅ Android Studio 설치 완료
- ✅ Capacitor Android 프로젝트 준비 완료
- ⏳ google-services.json 추가 필요
- ⏳ APK 빌드 대기 중