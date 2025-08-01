@echo off
echo ===== Firebase FCM v1 최종 테스트 =====
echo.
echo 1. real-fcm-token.html에서 생성된 FCM 토큰을 복사하세요
echo 2. 아래 명령어의 [FCM_TOKEN_HERE] 부분을 실제 토큰으로 교체하세요
echo 3. 수정된 명령어를 실행하세요
echo.
echo ===== 테스트 명령어 =====
echo.
echo curl -X POST https://bbxycbghbatcovzuiotu.supabase.co/functions/v1/send-firebase-fcm-notification ^
echo   -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJieHljYmdoYmF0Y292enVpb3R1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAyMDEwOTYsImV4cCI6MjA2NTc3NzA5Nn0.dvG6EzASvCOWQZ0AEHMseTV7WvgOnHNkt58NAviW5is" ^
echo   -H "Content-Type: application/json" ^
echo   -d "{\"fcm_tokens\":[\"[FCM_TOKEN_HERE]\"],\"notification\":{\"title\":\"🎉 T-Bridge 최종 테스트!\",\"body\":\"Firebase FCM v1 API 실제 토큰 테스트입니다!\",\"image\":\"https://firebase.google.com/images/brand-guidelines/logo-standard.png\"},\"data\":{\"type\":\"final_test\",\"timestamp\":\"%date% %time%\"}}"
echo.
echo ===== 예상 결과 =====
echo {"success":true,"sent":1,"failed":0,"results":[...],"service":"firebase-fcm-v1","version":"2025-v1-http"}
echo.
echo 성공 시 브라우저에서 실제 푸시 알림을 받게 됩니다!
echo.
pause