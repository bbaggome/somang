# Java 21 설치 가이드 (Android 빌드용)

## 문제 상황
Gradle 8.13과 Android Gradle Plugin 8.6+가 Java 21을 요구하고 있습니다.

## 해결 방법: Java 21 설치

### 1. Java 21 다운로드 및 설치

#### Adoptium (Eclipse Temurin) 추천
1. **다운로드**: https://adoptium.net/
2. **버전 선택**: 
   - Version: **21** (LTS)
   - Operating System: **Windows**  
   - Architecture: **x64**
   - Package Type: **JDK**
3. **.msi 파일** 다운로드 및 실행

#### 설치 시 중요 설정
- ✅ **"Set JAVA_HOME variable"** 체크
- ✅ **"Add to PATH"** 체크
- ✅ **"Associate .jar files"** 체크 (선택사항)

### 2. 설치 확인

#### 설치 완료 후 확인
새 명령 프롬프트에서:
```bash
java -version
javac -version
echo %JAVA_HOME%
```

#### 예상 결과
```
openjdk version "21.0.x" 2024-xx-xx
OpenJDK Runtime Environment Temurin-21.0.x+x
OpenJDK 64-Bit Server VM Temurin-21.0.x+x

javac 21.0.x

C:\Program Files\Eclipse Adoptium\jdk-21.0.x.x-hotspot
```

### 3. 여러 Java 버전 관리

#### 현재 상황
- Java 17: `C:\Program Files\Eclipse Adoptium\jdk-17.0.16.8-hotspot`
- Java 21: `C:\Program Files\Eclipse Adoptium\jdk-21.0.x.x-hotspot` (새로 설치)

#### 환경 변수 업데이트
1. **Windows + X** → "시스템" → "고급 시스템 설정"
2. "환경 변수" 버튼 클릭
3. **시스템 변수**에서 `JAVA_HOME` 수정:
   ```
   기존: C:\Program Files\Eclipse Adoptium\jdk-17.0.16.8-hotspot
   변경: C:\Program Files\Eclipse Adoptium\jdk-21.0.x.x-hotspot
   ```

### 4. Gradle 설정 업데이트

#### gradle.properties 수정
```properties
# Force Java 21 for all tasks
org.gradle.java.home=C:\\Program Files\\Eclipse Adoptium\\jdk-21.0.x.x-hotspot
java.toolchain.languageVersion=21

# Disable Java toolchain auto-provisioning
org.gradle.java.installations.auto-detect=false
org.gradle.java.installations.auto-download=false
```

#### app/build.gradle 수정
```gradle
compileOptions {
    sourceCompatibility JavaVersion.VERSION_21
    targetCompatibility JavaVersion.VERSION_21
}
```

### 5. Android 빌드 테스트

#### 빌드 명령어
```bash
cd android
gradlew.bat clean
gradlew.bat assembleDebug
```

#### 성공 확인
빌드 성공 시 APK 위치:
```
android/app/build/outputs/apk/debug/app-debug.apk
```

## 대안 방법 (Java 21 설치 없이)

### 옵션 1: Android Studio의 내장 JDK 사용
1. Android Studio 열기
2. **File** → **Settings** → **Build, Execution, Deployment** → **Build Tools** → **Gradle**
3. **Gradle JVM**: "Use Gradle from: specified location" 선택
4. Android Studio의 내장 JDK 경로 설정

### 옵션 2: Gradle Wrapper 다운그레이드 (비추천)
- 일부 기능이 작동하지 않을 수 있음
- Capacitor 호환성 문제 발생 가능

## 권장 해결 순서

### 1단계: Java 21 설치 (권장) ✅
- 가장 안정적이고 확실한 방법
- 최신 Android 개발 환경과 완전 호환

### 2단계: 환경 변수 업데이트
- JAVA_HOME을 Java 21로 변경
- gradle.properties 설정 업데이트

### 3단계: 빌드 테스트
- Android Studio 또는 명령줄에서 빌드
- APK 생성 및 테스트

## 설치 후 확인사항

### ✅ 체크리스트
- [ ] Java 21 설치 완료
- [ ] JAVA_HOME 환경 변수 업데이트
- [ ] gradle.properties 설정 변경
- [ ] Android 빌드 성공
- [ ] APK 생성 확인

---

**가장 확실한 방법은 Java 21을 설치하는 것입니다.**
Java 17과 Java 21을 함께 사용할 수 있으며, 필요에 따라 JAVA_HOME을 변경하여 사용할 수 있습니다.