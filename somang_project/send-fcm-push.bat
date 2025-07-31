@echo off
chcp 65001 > nul
echo FCM Push Notification Test Script
echo.

set /p SERVER_KEY="Enter Firebase Server Key: "
set FCM_TOKEN=fq3imbGJSxihmEwPeedOYU:APA91bFBlkNDOMefzosU3t8pVnWOvVzZ6Q7RRQRv-SMToXvEdKqAJJnH-NAZ8qE76A515_OldL5O_No9EucYjQo0NoxAYhnF6cF9Sqb1JQ4QTjvVgLX2tkQ

echo.
echo Sending notification...
echo.

curl -X POST https://fcm.googleapis.com/fcm/send ^
  -H "Authorization: key=%SERVER_KEY%" ^
  -H "Content-Type: application/json" ^
  -d "{\"to\": \"%FCM_TOKEN%\", \"notification\": {\"title\": \"Test Notification\", \"body\": \"Mobile App FCM Push Test!\"}}"

echo.
echo.
echo Send Complete! Check notification on your mobile device.
pause