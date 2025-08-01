# Cloudflare Tunnel 설정 가이드

Cloudflare Tunnel을 사용하면 로컬 개발 서버를 공식 SSL과 함께 외부에서 접근 가능하게 할 수 있습니다.

## 1. Cloudflare 계정 및 도메인 필요
- Cloudflare 계정 생성
- 도메인을 Cloudflare로 이전 (또는 Cloudflare에서 구매)

## 2. cloudflared 설치

### Windows
```powershell
# Chocolatey
choco install cloudflared

# 또는 직접 다운로드
# https://github.com/cloudflare/cloudflared/releases
```

### macOS
```bash
brew install cloudflared
```

### Linux
```bash
# Debian/Ubuntu
wget -q https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared-linux-amd64.deb
```

## 3. 인증 및 터널 생성

```bash
# Cloudflare 로그인
cloudflared tunnel login

# 터널 생성
cloudflared tunnel create tbridge-dev

# DNS 레코드 생성
cloudflared tunnel route dns tbridge-dev user-dev.yourdomain.com
cloudflared tunnel route dns tbridge-dev biz-dev.yourdomain.com
cloudflared tunnel route dns tbridge-dev admin-dev.yourdomain.com
```

## 4. 설정 파일 생성

`~/.cloudflared/config.yml`:
```yaml
tunnel: tbridge-dev
credentials-file: ~/.cloudflared/tunnel-id.json

ingress:
  - hostname: user-dev.yourdomain.com
    service: https://localhost:50443
    originRequest:
      noTLSVerify: true
  - hostname: biz-dev.yourdomain.com
    service: https://localhost:50444
    originRequest:
      noTLSVerify: true
  - hostname: admin-dev.yourdomain.com
    service: https://localhost:50445
    originRequest:
      noTLSVerify: true
  - service: http_status:404
```

## 5. 터널 실행

```bash
# 터널 시작
cloudflared tunnel run tbridge-dev

# 백그라운드 실행
cloudflared tunnel run --background tbridge-dev
```

## 접속
- User App: https://user-dev.yourdomain.com
- Biz App: https://biz-dev.yourdomain.com  
- Admin App: https://admin-dev.yourdomain.com

모든 접속이 공식 SSL 인증서로 보호됩니다!