#!/bin/bash

echo "🚀 Deploying user-app to Vercel..."
echo

echo "📁 Moving to user-app directory..."
cd user-app

echo "🔨 Building locally to check for errors..."
pnpm build
if [ $? -ne 0 ]; then
    echo "❌ Build failed! Fix errors before deploying."
    exit 1
fi

echo "✅ Build successful!"
echo

echo "🌐 Deploying to Vercel..."
vercel --prod

echo
echo "✨ Deployment complete!"
echo "📱 Check your Vercel dashboard for the live URL"