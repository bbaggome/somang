# Java 버전 롤백 및 Android 빌드 최종 해결

## 🔄 Java 17로 롤백하기

### 이유
- Android Gradle Plugin 8.2.2는 Java 17과 더 안정적으로 호환
- Capacitor의 Gradle 설정이 Java 21과 충돌하는 문제 회피

### 1. 환경 변수 변경 (중요!)

#### Windows 환경 변수 수정
1. **Windows + X** → "시스템" → "고급 시스템 설정"
2. "환경 변수" 버튼 클릭
3. **시스템 변수**에서 `JAVA_HOME` 수정:
   ```
   기존: C:\Program Files\Eclipse Adoptium\jdk-21.0.8.9-hotspot
   변경: C:\Program Files\Eclipse Adoptium\jdk-17.0.16.8-hotspot
   ```
4. **확인** 클릭하여 저장

#### 명령줄에서 확인
새 명령 프롬프트에서:
```bash
echo %JAVA_HOME%
java -version
```

예상 결과:
```
C:\Program Files\Eclipse Adoptium\jdk-17.0.16.8-hotspot\
openjdk version "17.0.16" 2025-07-15
```

### 2. 완료된 Gradle 설정 ✅

#### gradle.properties
```properties
# Force Java 17 for all tasks
org.gradle.java.home=C:\\Program Files\\Eclipse Adoptium\\jdk-17.0.16.8-hotspot
java.toolchain.languageVersion=17

# Enable Java toolchain auto-provisioning
org.gradle.java.installations.auto-detect=true
org.gradle.java.installations.auto-download=true

# Memory settings
org.gradle.jvmargs=-Xmx4096m -Dfile.encoding=UTF-8
```

#### build.gradle (프로젝트 레벨)
```gradle
classpath 'com.android.tools.build:gradle:8.2.2'

// Force Java 17 for all subprojects
subprojects {
    tasks.withType(JavaCompile).configureEach {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
}
```

#### app/build.gradle
```gradle
compileOptions {
    sourceCompatibility JavaVersion.VERSION_17
    targetCompatibility JavaVersion.VERSION_17
}
```

### 3. Android Studio에서 빌드

#### 환경 변수 변경 후
1. **Android Studio 완전 종료**
2. **새로 시작** (환경 변수 적용을 위해)
3. 프로젝트 열기: `npx cap open android`

#### 빌드 단계
1. **Gradle Sync** 대기 (자동 실행)
2. **Build** → **Build Bundle(s) / APK(s)** → **Build APK(s)**
3. 성공 시 APK 위치: `android/app/build/outputs/apk/debug/app-debug.apk`

### 4. 문제 해결

#### Gradle Sync 실패 시
1. **File** → **Invalidate Caches and Restart**
2. **File** → **Project Structure** → **SDK Location**에서 JDK 경로 확인

#### 여전히 Java 21 오류 발생 시
1. Android Studio 설정에서 JDK 경로 수동 설정
2. **File** → **Settings** → **Build Tools** → **Gradle**
3. **Gradle JVM**: Java 17 경로 선택

### 5. 대안 방법

#### 방법 1: 명령줄 직접 빌드
```bash
cd android
gradlew.bat clean
gradlew.bat assembleDebug
```

#### 방법 2: 환경 변수 임시 설정
빌드 전에 임시로:
```cmd
set JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-17.0.16.8-hotspot
gradlew.bat assembleDebug
```

## ✅ 체크리스트

### 필수 완료 사항
- [ ] JAVA_HOME 환경 변수를 Java 17로 변경
- [ ] Android Studio 재시작
- [ ] Gradle Sync 성공
- [ ] APK 빌드 성공

### 최종 목표
- [ ] app-debug.apk 생성 확인
- [ ] 휴대폰에 설치 테스트
- [ ] 카카오 로그인 작동 확인

---

**가장 중요한 것은 JAVA_HOME 환경 변수를 Java 17로 변경하는 것입니다!**

환경 변수 변경 후 Android Studio를 재시작하면 빌드가 성공할 것입니다.