@echo off
chcp 65001 > nul
echo.
echo ======================================
echo   Supabase FCM Notification Test
echo ======================================
echo.

set /p TITLE="Enter notification title (default: Supabase Test): "
if "%TITLE%"=="" set TITLE=Supabase Test

set /p BODY="Enter notification body (default: Batch file test!): "
if "%BODY%"=="" set BODY=Batch file test!

echo.
echo Sending FCM notification...
echo Title: %TITLE%
echo Body: %BODY%
echo.

curl -X POST "https://bbxycbghbatcovzuiotu.supabase.co/functions/v1/send-firebase-fcm-notification" ^
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJieHljYmdoYmF0Y292enVpb3R1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAyMDEwOTYsImV4cCI6MjA2NTc3NzA5Nn0.dvG6EzASvCOWQZ0AEHMseTV7WvgOnHNkt58NAviW5is" ^
  -H "Content-Type: application/json" ^
  -d "{\"fcm_tokens\": [\"fq3imbGJSxihmEwPeedOYU:APA91bFBlkNDOMefzosU3t8pVnWOvVzZ6Q7RRQRv-SMToXvEdKqAJJnH-NAZ8qE76A515_OldL5O_No9EucYjQo0NoxAYhnF6cF9Sqb1JQ4QTjvVgLX2tkQ\"], \"notification\": {\"title\": \"%TITLE%\", \"body\": \"%BODY%\"}, \"data\": {\"test\": \"true\", \"timestamp\": \"%date% %time%\"}}"

echo.
echo.
echo FCM notification sent! Check your mobile device.
echo.
pause