# PowerShell 스크립트 - Windows용 자체 서명 SSL 인증서 생성
# 개발 환경용 HTTPS 설정을 위한 인증서 생성

Write-Host "Generating self-signed SSL certificates for development..." -ForegroundColor Green

# 인증서 저장 경로
$certPath = ".\certs"

# 디렉토리가 없으면 생성
if (!(Test-Path $certPath)) {
    New-Item -ItemType Directory -Path $certPath
}

# 각 앱에 대한 인증서 생성
function Generate-AppCertificate {
    param(
        [string]$AppName,
        [string]$DnsName = "localhost"
    )
    
    Write-Host "Generating certificate for $AppName..." -ForegroundColor Yellow
    
    # 인증서 생성
    $cert = New-SelfSignedCertificate `
        -DnsName $DnsName, "$AppName.local", "127.0.0.1" `
        -CertStoreLocation "cert:\LocalMachine\My" `
        -NotAfter (Get-Date).AddYears(1) `
        -FriendlyName "$AppName Development Certificate" `
        -KeyAlgorithm RSA `
        -KeyLength 2048 `
        -HashAlgorithm SHA256 `
        -KeyUsage DigitalSignature, KeyEncipherment, DataEncipherment `
        -TextExtension @("2.5.29.37={text}1.3.6.1.5.5.7.3.1") # Server Authentication
    
    # 인증서를 PFX로 내보내기
    $pfxPath = Join-Path $certPath "$AppName.pfx"
    $password = ConvertTo-SecureString -String "tbridge-dev" -Force -AsPlainText
    Export-PfxCertificate -Cert $cert -FilePath $pfxPath -Password $password | Out-Null
    
    # PEM 형식으로 변환 (Node.js에서 사용하기 위해)
    $certPemPath = Join-Path $certPath "$AppName.crt"
    $keyPemPath = Join-Path $certPath "$AppName.key"
    
    # 인증서 내보내기 (PEM 형식)
    $certBase64 = [System.Convert]::ToBase64String($cert.RawData, [System.Base64FormattingOptions]::InsertLineBreaks)
    $pemCert = "-----BEGIN CERTIFICATE-----`n$certBase64`n-----END CERTIFICATE-----"
    Set-Content -Path $certPemPath -Value $pemCert -Encoding UTF8
    
    Write-Host "Certificate for $AppName created: $certPemPath" -ForegroundColor Green
    Write-Host "Note: Private key export requires manual conversion from PFX" -ForegroundColor Yellow
    
    return $cert
}

# 각 앱에 대한 인증서 생성
Generate-AppCertificate -AppName "user-app"
Generate-AppCertificate -AppName "biz-app"
Generate-AppCertificate -AppName "admin-app"

Write-Host "`nSSL certificates generated successfully!" -ForegroundColor Green
Write-Host "Certificate files location: $certPath" -ForegroundColor Cyan
Write-Host "Password for PFX files: tbridge-dev" -ForegroundColor Yellow
Write-Host "`nNote: These are self-signed certificates for development only." -ForegroundColor Yellow
Write-Host "You may need to trust these certificates in your browser." -ForegroundColor Yellow