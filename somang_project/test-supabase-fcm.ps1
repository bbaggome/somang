# Supabase FCM 테스트 스크립트
$supabaseUrl = "https://bbxycbghbatcovzuiotu.supabase.co"
$supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJieHljYmdoYmF0Y292enVpb3R1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAyMDEwOTYsImV4cCI6MjA2NTc3NzA5Nn0.dvG6EzASvCOWQZ0AEHMseTV7WvgOnHNkt58NAviW5is"
$fcmToken = "fq3imbGJSxihmEwPeedOYU:APA91bFBlkNDOMefzosU3t8pVnWOvVzZ6Q7RRQRv-SMToXvEdKqAJJnH-NAZ8qE76A515_OldL5O_No9EucYjQo0NoxAYhnF6cF9Sqb1JQ4QTjvVgLX2tkQ"

Write-Host "🚀 Supabase FCM 알림 테스트" -ForegroundColor Green
Write-Host ""

$title = Read-Host "알림 제목을 입력하세요 (기본값: Supabase 테스트)"
if ([string]::IsNullOrWhiteSpace($title)) {
    $title = "Supabase 테스트"
}

$body = Read-Host "알림 내용을 입력하세요 (기본값: PowerShell에서 전송!)"
if ([string]::IsNullOrWhiteSpace($body)) {
    $body = "PowerShell에서 전송!"
}

$payload = @{
    fcm_tokens = @($fcmToken)
    notification = @{
        title = $title
        body = $body
    }
    data = @{
        test = "true"
        timestamp = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
    }
} | ConvertTo-Json -Depth 3

Write-Host ""
Write-Host "📤 FCM 알림 전송 중..." -ForegroundColor Yellow

try {
    $response = Invoke-RestMethod -Uri "$supabaseUrl/functions/v1/send-firebase-fcm-notification" `
        -Method POST `
        -Headers @{
            "Authorization" = "Bearer $supabaseKey"
            "Content-Type" = "application/json"
        } `
        -Body $payload

    if ($response.success -and $response.sent -gt 0) {
        Write-Host "✅ FCM 알림 전송 성공!" -ForegroundColor Green
        Write-Host "   성공: $($response.sent), 실패: $($response.failed)" -ForegroundColor Green
        Write-Host "   메시지 ID: $($response.results[0].message_id)" -ForegroundColor Gray
    } else {
        Write-Host "❌ FCM 알림 전송 실패:" -ForegroundColor Red
        Write-Host $response -ForegroundColor Red
    }
} catch {
    Write-Host "❌ 오류 발생: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "Press any key to continue..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")