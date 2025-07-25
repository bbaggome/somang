// user-app/src/app/layout.tsx (수정된 버전)
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";
import { NotificationProvider } from "@/components/NotificationProvider";
import { RealtimeNotificationProvider } from "@/components/RealtimeNotificationProvider"; // 추가
import NotificationPermissionPrompt from "@/components/NotificationPermissionPrompt";
import MobileWrapper from "./mobile-wrapper";
import MobilePushHandler from "@/components/MobilePushHandler";
import DeepLinkHandler from "@/components/DeepLinkHandler";
import NotificationToast from "@/components/NotificationToast";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "T-BRIDGE",
  description: "가장 투명한 통신 견적 비교",
  keywords: ["통신", "견적", "비교", "T-BRIDGE"],
  authors: [{ name: "T-BRIDGE Team" }],
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#2563eb',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body 
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <MobileWrapper>
          <AuthProvider>
            <NotificationProvider>
              <RealtimeNotificationProvider> {/* 실시간 알림 추가 */}
                {children}
                <NotificationPermissionPrompt />
                <MobilePushHandler />
                <DeepLinkHandler />
                <NotificationToast />
              </RealtimeNotificationProvider>
            </NotificationProvider>
          </AuthProvider>
        </MobileWrapper>
        
        {/* 모바일 앱 리다이렉트 스크립트 */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // 모바일 앱에서 웹 브라우저로 열린 경우 자동으로 앱으로 돌아가기
              (function() {
                if (window.location.href.includes('access_token=') || window.location.href.includes('authenticated')) {
                  // 모바일 기기인지 확인
                  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
                  
                  if (isMobile) {
                    setTimeout(function() {
                      // 커스텀 스킴으로 앱 열기 시도
                      window.location.href = 'com.tbridge.userapp://auth/success';
                      
                      // 1초 후에도 리다이렉트 안 되면 앱 종료 안내
                      setTimeout(function() {
                        document.body.innerHTML = '<div style="text-align:center;padding:50px;font-family:Arial,sans-serif;"><h2>로그인 완료!</h2><p>앱으로 돌아가세요.</p><button onclick="window.close();" style="padding:10px 20px;background:#007bff;color:white;border:none;border-radius:5px;cursor:pointer;">창 닫기</button></div>';
                      }, 1000);
                    }, 500);
                  }
                  // PC에서는 정상적인 리다이렉트 처리 (아무것도 하지 않음)
                }
              })();
            `,
          }}
        />
      </body>
    </html>
  );
}