#!/bin/bash

# 자체 서명 SSL 인증서 생성 스크립트
# 개발 환경용 HTTPS 설정을 위한 인증서 생성

echo "Generating self-signed SSL certificates for development..."

# 인증서 디렉토리 생성
mkdir -p ./certs

# Root CA 키 생성
openssl genrsa -out ./certs/rootCA.key 2048

# Root CA 인증서 생성
openssl req -x509 -new -nodes -key ./certs/rootCA.key -sha256 -days 3650 -out ./certs/rootCA.pem -subj "/C=KR/ST=Seoul/L=Seoul/O=T-Bridge Dev/OU=Development/CN=T-Bridge Root CA"

# 각 앱에 대한 인증서 생성 함수
generate_app_cert() {
    APP_NAME=$1
    PORT=$2
    
    echo "Generating certificate for $APP_NAME..."
    
    # 서버 키 생성
    openssl genrsa -out ./certs/${APP_NAME}.key 2048
    
    # CSR 생성
    openssl req -new -key ./certs/${APP_NAME}.key -out ./certs/${APP_NAME}.csr -subj "/C=KR/ST=Seoul/L=Seoul/O=T-Bridge/OU=Development/CN=localhost"
    
    # 인증서 확장 설정 파일 생성
    cat > ./certs/${APP_NAME}.ext <<EOF
authorityKeyIdentifier=keyid,issuer
basicConstraints=CA:FALSE
keyUsage = digitalSignature, nonRepudiation, keyEncipherment, dataEncipherment
subjectAltName = @alt_names

[alt_names]
DNS.1 = localhost
DNS.2 = ${APP_NAME}
DNS.3 = ${APP_NAME}.local
IP.1 = 127.0.0.1
IP.2 = ::1
EOF

    # 서버 인증서 생성
    openssl x509 -req -in ./certs/${APP_NAME}.csr -CA ./certs/rootCA.pem -CAkey ./certs/rootCA.key -CAcreateserial -out ./certs/${APP_NAME}.crt -days 365 -sha256 -extfile ./certs/${APP_NAME}.ext
    
    # 임시 파일 정리
    rm ./certs/${APP_NAME}.csr ./certs/${APP_NAME}.ext
}

# 각 앱에 대한 인증서 생성
generate_app_cert "user-app" "50443"
generate_app_cert "biz-app" "50444"
generate_app_cert "admin-app" "50445"

echo "SSL certificates generated successfully!"
echo ""
echo "Certificate files location: ./certs/"
echo "- Root CA: rootCA.pem, rootCA.key"
echo "- user-app: user-app.crt, user-app.key"
echo "- biz-app: biz-app.crt, biz-app.key"
echo "- admin-app: admin-app.crt, admin-app.key"
echo ""
echo "Note: These are self-signed certificates for development only."
echo "You may need to add the Root CA certificate to your system's trusted certificates."