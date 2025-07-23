# Android Java 버전 문제 해결 가이드

## 문제 상황
```
Cannot find a Java installation on your machine (Windows 11 10.0 amd64) matching: {languageVersion=21, vendor=any vendor, implementation=vendor-specific}
```

## 해결 방법들

### 1. 환경 변수 확인 및 설정 ✅

#### JAVA_HOME 확인
```bash
echo %JAVA_HOME%
```
결과: `C:\Program Files\Eclipse Adoptium\jdk-17.0.16.8-hotspot\`

#### 환경 변수 수동 설정 (필요시)
1. Windows + X → "시스템" → "고급 시스템 설정"
2. "환경 변수" 버튼 클릭
3. 시스템 변수에서 `JAVA_HOME` 확인/수정:
   ```
   JAVA_HOME = C:\Program Files\Eclipse Adoptium\jdk-17.0.16.8-hotspot
   ```

### 2. Gradle 설정 수정 ✅

#### gradle.properties 수정
```properties
# Force Java 17 for all tasks
org.gradle.java.home=C:\\Program Files\\Eclipse Adoptium\\jdk-17.0.16.8-hotspot
java.toolchain.languageVersion=17
```

#### build.gradle (프로젝트 레벨) 수정
```gradle
// Force Java 17 for all subprojects
subprojects {
    tasks.withType(JavaCompile).configureEach {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
}
```

#### app/build.gradle 수정
```gradle
compileOptions {
    sourceCompatibility JavaVersion.VERSION_17
    targetCompatibility JavaVersion.VERSION_17
}
```

### 3. Gradle Wrapper 다운그레이드 ✅
Gradle 8.5로 다운그레이드 (Java 21 요구사항 회피):
```properties
distributionUrl=https\://services.gradle.org/distributions/gradle-8.5-all.zip
```

### 4. 수동 빌드 방법

#### Android Studio에서 빌드
1. Android Studio 열기
2. File → Open → android 폴더 선택
3. Build → Build Bundle(s) / APK(s) → Build APK(s)

#### 명령어로 빌드 (권장)
```bash
cd android
gradlew.bat clean
gradlew.bat assembleDebug
```

### 5. 대안 해결책

#### 옵션 1: Java 21 설치
Java 21을 추가로 설치하고 JAVA_HOME 변경:
```
https://adoptium.net/
→ Java 21 다운로드 및 설치
```

#### 옵션 2: Android Studio의 내장 Java 사용
Android Studio의 내장 JDK 사용:
```
File → Project Structure → SDK Location → JDK location
```

### 6. 환경 정리 명령어

#### Gradle 캐시 정리
```bash
gradlew.bat --stop
gradlew.bat clean
gradlew.bat build --refresh-dependencies
```

#### .gradle 폴더 삭제 (최후 수단)
```
C:\Works\somang\somang\somang_project\user-app\android\.gradle
```
이 폴더를 삭제 후 다시 빌드

## 현재 적용된 설정

### ✅ 완료된 작업
1. gradle.properties에 Java 17 강제 설정
2. build.gradle에 Java 17 호환성 설정
3. app/build.gradle에 compileOptions 설정
4. Gradle Wrapper 8.5로 다운그레이드

### 🔄 다음 시도할 방법
1. Android Studio에서 직접 빌드
2. Java 21 설치 (필요시)
3. Gradle 캐시 완전 정리

## 빌드 테스트

### 성공 확인 방법
```bash
cd android
gradlew.bat assembleDebug
```

### APK 위치
빌드 성공 시:
```
android/app/build/outputs/apk/debug/app-debug.apk
```

---

**권장 해결 순서:**
1. Android Studio에서 직접 빌드 시도
2. 성공하면 APK 추출하여 테스트
3. 실패하면 Java 21 설치 고려