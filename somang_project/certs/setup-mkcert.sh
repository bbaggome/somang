#!/bin/bash

# mkcert를 사용한 로컬 개발용 신뢰할 수 있는 SSL 인증서 생성
# 브라우저에서 경고 없이 사용 가능

echo "Setting up mkcert for trusted local SSL certificates..."

# mkcert 설치 확인
if ! command -v mkcert &> /dev/null; then
    echo "mkcert가 설치되지 않았습니다."
    echo "설치 방법:"
    echo "- Windows (Chocolatey): choco install mkcert"
    echo "- macOS (Homebrew): brew install mkcert"
    echo "- Linux: https://github.com/FiloSottile/mkcert#installation"
    exit 1
fi

# 로컬 CA 설치 (최초 1회만)
echo "Installing local CA..."
mkcert -install

# 인증서 디렉토리 생성
mkdir -p ./certs

# 각 앱에 대한 인증서 생성
echo "Generating certificates..."

# user-app 인증서
mkcert -key-file ./certs/user-app.key -cert-file ./certs/user-app.crt \
  localhost 127.0.0.1 ::1 user-app.local

# biz-app 인증서  
mkcert -key-file ./certs/biz-app.key -cert-file ./certs/biz-app.crt \
  localhost 127.0.0.1 ::1 biz-app.local

# admin-app 인증서
mkcert -key-file ./certs/admin-app.key -cert-file ./certs/admin-app.crt \
  localhost 127.0.0.1 ::1 admin-app.local

echo "✅ Trusted SSL certificates generated successfully!"
echo ""
echo "Certificate files:"
echo "- user-app: ./certs/user-app.crt, ./certs/user-app.key"
echo "- biz-app: ./certs/biz-app.crt, ./certs/biz-app.key" 
echo "- admin-app: ./certs/admin-app.crt, ./certs/admin-app.key"
echo ""
echo "These certificates are trusted by your system and browsers."
echo "No security warnings will appear!"