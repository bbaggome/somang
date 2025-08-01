@echo off
echo 🚀 Deploying user-app to Vercel...
echo.

echo 📁 Moving to user-app directory...
cd user-app

echo 🔨 Building locally to check for errors...
call pnpm build
if %errorlevel% neq 0 (
    echo ❌ Build failed! Fix errors before deploying.
    pause
    exit /b 1
)

echo ✅ Build successful!
echo.

echo 🌐 Deploying to Vercel...
call vercel --prod

echo.
echo ✨ Deployment complete!
echo 📱 Check your Vercel dashboard for the live URL
pause