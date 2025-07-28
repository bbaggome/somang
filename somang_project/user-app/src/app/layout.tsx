// user-app/src/app/layout.tsx (수정된 버전)
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";
import { NotificationProvider } from "@/components/NotificationProvider";
import { RealtimeNotificationProvider } from "@/components/RealtimeNotificationProvider"; // 추가
import NotificationPermissionPrompt from "@/components/NotificationPermissionPrompt";
import MobileWrapper from "./mobile-wrapper";
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
                <NotificationToast />
              </RealtimeNotificationProvider>
            </NotificationProvider>
          </AuthProvider>
        </MobileWrapper>
      </body>
    </html>
  );
}