# mkcert를 사용한 Windows용 신뢰할 수 있는 SSL 인증서 생성
# 브라우저에서 경고 없이 사용 가능

Write-Host "Setting up mkcert for trusted local SSL certificates..." -ForegroundColor Green

# mkcert 실행 파일 경로 설정
$mkcertPath = ".\mkcert.exe"

# mkcert 설치 확인 (로컬 실행 파일 또는 시스템 설치)
if (!(Test-Path $mkcertPath) -and !(Get-Command mkcert -ErrorAction SilentlyContinue)) {
    Write-Host "mkcert 다운로드 중..." -ForegroundColor Yellow
    
    # GitHub에서 mkcert 다운로드
    $downloadUrl = "https://github.com/FiloSottile/mkcert/releases/download/v1.4.4/mkcert-v1.4.4-windows-amd64.exe"
    Invoke-WebRequest -Uri $downloadUrl -OutFile $mkcertPath
    
    Write-Host "mkcert 다운로드 완료!" -ForegroundColor Green
}

# mkcert 명령어 설정
$mkcertCmd = if (Test-Path $mkcertPath) { $mkcertPath } else { "mkcert" }

# 로컬 CA 설치 (최초 1회만)
Write-Host "Installing local CA..." -ForegroundColor Yellow
& $mkcertCmd -install

# 각 앱에 대한 인증서 생성
Write-Host "Generating certificates..." -ForegroundColor Yellow

# 현재 시스템의 IP 주소 자동 감지
$ipAddresses = @()
$networkAdapters = Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -ne "127.0.0.1" -and $_.PrefixOrigin -ne "WellKnown" }
foreach ($adapter in $networkAdapters) {
    $ipAddresses += $adapter.IPAddress
}

Write-Host "Detected IP addresses: $($ipAddresses -join ', ')" -ForegroundColor Cyan

# 기본 호스트명과 IP 설정
$baseHosts = @("localhost", "127.0.0.1", "::1")
$allHosts = $baseHosts + $ipAddresses

# user-app 인증서
& $mkcertCmd -key-file "user-app.key" -cert-file "user-app.crt" `
  ($allHosts + "user-app.local")

# biz-app 인증서  
& $mkcertCmd -key-file "biz-app.key" -cert-file "biz-app.crt" `
  ($allHosts + "biz-app.local")

# admin-app 인증서
& $mkcertCmd -key-file "admin-app.key" -cert-file "admin-app.crt" `
  ($allHosts + "admin-app.local")

Write-Host "✅ Trusted SSL certificates generated successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Certificate files:" -ForegroundColor Cyan
Write-Host "- user-app: user-app.crt, user-app.key" -ForegroundColor White
Write-Host "- biz-app: biz-app.crt, biz-app.key" -ForegroundColor White
Write-Host "- admin-app: admin-app.crt, admin-app.key" -ForegroundColor White
Write-Host ""
Write-Host "These certificates are trusted by your system and browsers." -ForegroundColor Green
Write-Host "No security warnings will appear!" -ForegroundColor Green