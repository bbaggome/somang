# Kakao Android 플랫폼 등록 정보

## SHA1 정보 (signingReport 결과)
```
SHA1: 2D:D8:36:A3:7E:01:9A:7A:39:F4:EF:6B:C6:B9:B8:03:FF:0B:FD:98
```

## Kakao에 등록할 키 해시
```
Ldg2o34Bmno59O9rxrm4A/8L/Zg=
```

## Kakao Developers 등록 방법

### 1. Android 플랫폼 추가
1. https://developers.kakao.com/ 접속
2. 내 애플리케이션 → T-Bridge 선택
3. **앱 설정** → **플랫폼** → **플랫폼 추가** → **Android**

### 2. 필수 입력 정보
- **패키지명**: `com.tbridge.userapp`
- **키 해시**: `Ldg2o34Bmno59O9rxrm4A/8L/Zg=`

### 3. 추가 설정 확인
- **제품 설정** → **카카오 로그인**
- Android 플랫폼 **활성화** 체크
- Redirect URI 확인: `https://bbxycbghbatcovzuiotu.supabase.co/auth/v1/callback`

## 중요 참고사항
- 이 키 해시는 개발용(debug.keystore) 입니다
- 릴리스 버전을 만들 때는 릴리스 키스토어의 키 해시를 추가로 등록해야 합니다
- 여러 개의 키 해시를 등록할 수 있습니다

## 테스트 방법
1. Kakao Developers에서 위 키 해시 등록
2. 앱에서 카카오 로그인 다시 시도
3. 정상적으로 로그인 후 앱으로 복귀되는지 확인

---
등록 완료 후 앱을 다시 실행하면 카카오 로그인이 정상 작동할 것입니다!