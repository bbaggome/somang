# Android Studio APK 빌드 가이드

## 현재 상태 ✅
- ✅ Java 21 설치 완료: `C:\Program Files\Eclipse Adoptium\jdk-21.0.8.9-hotspot\`
- ✅ JAVA_HOME 환경 변수 설정 완료
- ✅ gradle.properties Java 21 설정 완료
- ✅ 모든 build.gradle 파일 Java 21 호환성 설정 완료
- ✅ Gradle 캐시 정리 완료

## Android Studio에서 빌드하기

### 1. Android Studio 열기 ✅
`npx cap open android` 명령으로 Android Studio가 열렸습니다.

### 2. 프로젝트 로딩 대기
- Android Studio가 프로젝트를 로딩하는 동안 기다리세요
- 하단의 "Sync" 진행 상황을 확인하세요
- 첫 실행 시 Gradle 다운로드로 시간이 걸릴 수 있습니다

### 3. Gradle Sync 확인
#### 성공하면:
- "Gradle sync finished" 메시지 표시
- 프로젝트 구조가 정상적으로 표시됨

#### 실패하면:
- "Sync Now" 버튼 클릭하여 재시도
- 또는 File → Sync Project with Gradle Files

### 4. APK 빌드
#### 방법 1: 메뉴에서 빌드
1. **Build** → **Build Bundle(s) / APK(s)** → **Build APK(s)** 클릭
2. 빌드 진행 상황을 하단 "Build" 탭에서 확인
3. 완료되면 "BUILD SUCCESSFUL" 메시지 확인

#### 방법 2: Gradle 탭에서 빌드
1. 우측 **Gradle** 탭 클릭
2. **app** → **Tasks** → **build** → **assembleDebug** 더블클릭

### 5. APK 위치 확인
빌드 성공 시 APK 위치:
```
C:\Works\somang\somang\somang_project\user-app\android\app\build\outputs\apk\debug\app-debug.apk
```

### 6. APK 설치 및 테스트
1. USB로 Android 폰 연결
2. 개발자 옵션 → USB 디버깅 활성화
3. APK 파일을 폰으로 전송하여 설치
4. 또는 Android Studio에서 **Run** 버튼 클릭

## 문제 해결

### Gradle Sync 실패 시
#### "Cannot find Java installation" 오류
1. **File** → **Project Structure** → **SDK Location**
2. **JDK location** 확인: `C:\Program Files\Eclipse Adoptium\jdk-21.0.8.9-hotspot`
3. 경로가 다르면 수정 후 **Apply**

#### 네트워크 오류
- VPN 해제 후 재시도
- 회사 네트워크인 경우 프록시 설정 확인

### 빌드 실패 시
#### 메모리 부족
gradle.properties에 추가:
```properties
org.gradle.jvmargs=-Xmx4096m
```

#### Clean Build
1. **Build** → **Clean Project**
2. **Build** → **Rebuild Project**

### 최종 확인사항

#### ✅ 체크리스트
- [ ] Android Studio 프로젝트 정상 로딩
- [ ] Gradle Sync 성공
- [ ] APK 빌드 성공
- [ ] app-debug.apk 파일 생성 확인
- [ ] 실제 기기에 설치 테스트

## 빌드 성공 후 다음 단계

### 카카오 로그인 테스트
1. **Kakao Developers**에서 Android 플랫폼 등록 확인
   - 패키지명: `com.tbridge.userapp`
   - 키 해시: `Ldg2o34Bmno59O9rxrm4A/8L/Zg=`

2. **Supabase** 설정 확인
   - Kakao Provider 활성화
   - Client ID/Secret 설정

3. **앱에서 테스트**
   - 카카오 로그인 버튼 클릭
   - 카카오 브라우저에서 로그인
   - 앱으로 정상 복귀 확인

---

**Android Studio에서 빌드가 가장 확실한 방법입니다!**
위 단계를 따라하면 APK 생성이 성공할 것입니다.