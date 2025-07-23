# Kakao Developers Android 플랫폼 등록 가이드

## 문제 상황
- 카카오 로그인 → 브라우저(about:blank) → 앱 복귀 안됨
- **원인**: Kakao Developers에서 Android 플랫폼이 등록되지 않음

## 해결 방법: Android 플랫폼 등록

### 1. Kakao Developers Console 접속
1. https://developers.kakao.com/ 접속
2. 로그인 후 "내 애플리케이션" 클릭
3. T-Bridge 애플리케이션 선택

### 2. 플랫폼 설정 이동
1. 좌측 메뉴에서 **"앱 설정"** 클릭
2. **"플랫폼"** 메뉴 클릭

### 3. Android 플랫폼 추가
1. **"플랫폼 추가"** 버튼 클릭
2. **"Android"** 선택

### 4. Android 플랫폼 정보 입력

#### 필수 입력 정보:

**패키지명**:
```
com.tbridge.userapp
```

**마켓 URL** (선택사항):
```
(비워두거나 추후 Play Store URL 입력)
```

**키 해시**:
이 부분이 중요합니다! 키 해시를 생성해야 합니다.

## 키 해시 생성 방법

### 방법 1: 디버그 키 해시 (개발용)

#### Windows에서 생성:
```bash
keytool -exportcert -alias androiddebugkey -keystore "%USERPROFILE%\.android\debug.keystore" -storepass android -keypass android | openssl sha1 -binary | openssl base64
```

#### 디버그 키스토어 위치:
```
C:\Users\[사용자명]\.android\debug.keystore
```

### 방법 2: Android Studio에서 확인
1. Android Studio에서 프로젝트 열기
2. 우측 Gradle 탭 클릭
3. `android` → `Tasks` → `android` → `signingReport` 더블클릭
4. 결과에서 **SHA1** 값 복사

### 방법 3: APK에서 추출 (권장)
현재 빌드된 APK에서 직접 추출:

#### 1. APK 위치 확인:
```
C:\Works\somang\somang\somang_project\user-app\android\app\build\outputs\apk\debug\app-debug.apk
```

#### 2. APK 분석 도구 사용:
Android Studio의 APK Analyzer 또는 온라인 도구 사용

#### 3. 간단한 방법 - 앱에서 직접 확인:
앱에 키 해시를 출력하는 코드 추가 (임시):

```java
// MainActivity.java에 추가 (임시)
try {
    PackageInfo info = getPackageManager().getPackageInfo(
        "com.tbridge.userapp", 
        PackageManager.GET_SIGNATURES);
    for (Signature signature : info.signatures) {
        MessageDigest md = MessageDigest.getInstance("SHA");
        md.update(signature.toByteArray());
        Log.d("KeyHash:", Base64.encodeToString(md.digest(), Base64.DEFAULT));
    }
} catch (Exception e) {
    e.printStackTrace();
}
```

## 일반적인 디버그 키 해시
개발용으로 자주 사용되는 기본 키 해시:
```
Xo8WBi6jzSxKDVR4drqm84yr9iU=
```

## Kakao Developers 설정 완료

### 5. 플랫폼 등록 완료
1. 패키지명: `com.tbridge.userapp`
2. 키 해시: (위에서 생성한 값)
3. **"저장"** 버튼 클릭

### 6. 추가 확인사항

#### 카카오 로그인 활성화
1. **"제품 설정"** → **"카카오 로그인"**
2. **"활성화 설정"** ON 확인
3. **"Android"** 플랫폼 활성화 확인

#### Redirect URI 확인
**"제품 설정"** → **"카카오 로그인"** → **"Redirect URI"**:
```
https://bbxycbghbatcovzuiotu.supabase.co/auth/v1/callback
```

## 테스트 방법

### 1. 새 APK 빌드 (필요시)
만약 키 해시가 변경되었다면:
```bash
cd android
.\gradlew clean
.\gradlew assembleDebug
```

### 2. 앱 테스트
1. 새 APK 설치
2. 카카오 로그인 시도
3. 정상적으로 카카오 브라우저에서 로그인 후 앱 복귀 확인

## 문제 해결

### "앱 키 해시가 등록되지 않음" 오류
- 키 해시 재생성 및 재등록
- 디버그/릴리스 키스토어 확인

### "허가되지 않은 앱" 오류
- 패키지명 확인: `com.tbridge.userapp`
- 플랫폼 등록 상태 확인

### 여전히 about:blank 표시
- Kakao 앱이 설치되어 있는지 확인
- 카카오톡 로그인 대신 브라우저 로그인 사용

---

## 체크리스트 ✅

- [ ] Kakao Developers → 플랫폼 → Android 추가
- [ ] 패키지명: `com.tbridge.userapp` 입력
- [ ] 키 해시 생성 및 등록
- [ ] 카카오 로그인 Android 플랫폼 활성화
- [ ] 앱 테스트 및 로그인 확인

이 설정을 완료하면 카카오 로그인이 정상 작동할 것입니다!