# HTTPS 설정 가이드

T-Bridge 프로젝트의 모든 앱(user-app, biz-app, admin-app)을 Docker 환경에서 HTTPS로 실행하도록 설정되었습니다.

## SSL 인증서 옵션

### 옵션 1: mkcert (추천 - 로컬 개발용) ✅ 설정 완료
**장점**: 브라우저에서 경고 없음, 설정 간단, 완전 신뢰됨
**단점**: 로컬 개발 전용

#### 인증서 생성 (이미 완료됨)
```bash
# Windows - 자동 다운로드 및 설치
cd certs && powershell .\setup-mkcert.ps1

# macOS  
brew install mkcert
cd certs && chmod +x setup-mkcert.sh && ./setup-mkcert.sh

# Linux
# https://github.com/FiloSottile/mkcert#installation 참고
cd certs && chmod +x setup-mkcert.sh && ./setup-mkcert.sh
```

**현재 상태**: mkcert로 신뢰할 수 있는 인증서가 이미 생성되어 있습니다! 🎉

### 옵션 2: 자체 서명 인증서 (기본)
**장점**: 외부 도구 불필요
**단점**: 브라우저 보안 경고 표시

#### Windows (PowerShell)
```powershell
cd certs
.\generate-certs.ps1
```

#### Linux/Mac
```bash
cd certs
chmod +x generate-certs.sh
./generate-certs.sh
```

### 옵션 3: Cloudflare Tunnel (외부 접근 필요시)
**장점**: 공식 SSL, 외부 접근 가능, 무료
**단점**: 도메인 필요, 설정 복잡

자세한 설정은 `cloudflare-tunnel-setup.md` 참고

## Docker로 실행

### 모든 앱 동시 실행 (HTTPS)
```bash
docker-compose --profile dev up --build
```

### 개별 앱 실행
```bash
# User App (https://localhost:50443)
docker-compose up user-app-dev

# Biz App (https://localhost:50444)
docker-compose up biz-app-dev

# Admin App (https://localhost:50445)
docker-compose up admin-app-dev
```

## 접속 URL

- **User App**: https://localhost:50443
- **Biz App**: https://localhost:50444
- **Admin App**: https://localhost:50445

## 주요 특징

1. **🎉 브라우저 경고 없음**: mkcert로 생성된 신뢰할 수 있는 인증서를 사용하므로 브라우저에서 보안 경고가 표시되지 않습니다!

2. **📁 인증서 위치**: 모든 인증서는 `./certs` 디렉토리에 저장됩니다.
   - `user-app.crt`, `user-app.key`
   - `biz-app.crt`, `biz-app.key`  
   - `admin-app.crt`, `admin-app.key`
   - `mkcert.exe` (Windows용 실행 파일)

3. **🔒 완전 신뢰**: 시스템의 인증서 저장소에 등록된 신뢰할 수 있는 인증서입니다.

4. **⏰ 유효기간**: 2027년 10월까지 유효 (약 3년)

## 로컬 개발 (Docker 없이)

각 앱 디렉토리에서 HTTPS로 실행:
```bash
# User App
cd user-app && pnpm dev:https

# Biz App  
cd biz-app && pnpm dev:https

# Admin App
cd admin-app && pnpm dev:https
```

**Note**: 로컬 실행 시에도 먼저 인증서를 생성해야 합니다.