# Java JDK 설치 가이드 (Windows)

## 1. JDK 다운로드

### 옵션 1: Adoptium (추천) ✅
1. https://adoptium.net/ 접속
2. "Latest LTS Release" 클릭
3. 다음 옵션 선택:
   - Version: **17** (LTS)
   - Operating System: **Windows**
   - Architecture: **x64**
   - Package Type: **JDK**
   - Distribution: **Temurin**
4. **.msi** 파일 다운로드

### 옵션 2: Oracle JDK
1. https://www.oracle.com/java/technologies/downloads/
2. Java 17 선택
3. Windows x64 Installer 다운로드
4. Oracle 계정 필요 (무료)

## 2. JDK 설치

### MSI 설치 과정:
1. 다운로드한 .msi 파일 실행
2. "Next" 클릭
3. 설치 경로 확인 (기본값 권장):
   ```
   C:\Program Files\Eclipse Adoptium\jdk-17.0.x-hotspot\
   ```
4. "Set JAVA_HOME variable" 옵션 ✅ 체크 (중요!)
5. "Add to PATH" 옵션 ✅ 체크 (중요!)
6. "Next" → "Install" 클릭
7. 설치 완료

## 3. 환경 변수 확인 및 설정

### 자동 설정 확인:
1. **Windows + R** → `cmd` 입력
2. 다음 명령어 실행:
   ```bash
   java -version
   javac -version
   echo %JAVA_HOME%
   ```

### 수동 설정 (필요한 경우):
1. **Windows + X** → "시스템" 클릭
2. "고급 시스템 설정" 클릭
3. "환경 변수" 버튼 클릭

#### JAVA_HOME 설정:
1. "시스템 변수"에서 "새로 만들기" 클릭
2. 변수 이름: `JAVA_HOME`
3. 변수 값: `C:\Program Files\Eclipse Adoptium\jdk-17.0.x-hotspot`
4. "확인" 클릭

#### PATH 설정:
1. "시스템 변수"에서 "Path" 선택 → "편집"
2. "새로 만들기" 클릭
3. `%JAVA_HOME%\bin` 추가
4. "확인" 클릭

## 4. 설치 확인

새 명령 프롬프트 창을 열고 확인:

```bash
# Java 버전 확인
java -version

# 예상 출력:
# openjdk version "17.0.x" 2023-xx-xx
# OpenJDK Runtime Environment Temurin-17.0.x+x
# OpenJDK 64-Bit Server VM Temurin-17.0.x+x

# Java 컴파일러 확인
javac -version

# 예상 출력:
# javac 17.0.x

# JAVA_HOME 확인
echo %JAVA_HOME%

# 예상 출력:
# C:\Program Files\Eclipse Adoptium\jdk-17.0.x-hotspot
```

## 5. Capacitor에서 Java 확인

```bash
cd C:\Works\somang\somang\somang_project\user-app
npx cap doctor
```

## 문제 해결

### "java는 내부 또는 외부 명령이 아닙니다" 오류:
1. 환경 변수 설정 다시 확인
2. 명령 프롬프트 재시작
3. PC 재부팅

### JAVA_HOME 관련 오류:
1. JAVA_HOME 경로에 공백이나 특수문자 없는지 확인
2. 경로 끝에 백슬래시(\) 없는지 확인
3. 실제 JDK 설치 경로와 일치하는지 확인

## 다음 단계
Java JDK 설치 완료 후:
1. Android Studio 설치
2. Android SDK 설정
3. Capacitor 앱 빌드

---
✅ Java 17 LTS 버전을 설치하면 Android 개발에 최적화되어 있습니다.