// 6. user-app/src/app/layout.tsx (수정)
// NotificationProvider 추가

import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";
import { NotificationProvider } from "@/components/NotificationProvider"; // 추가
import NotificationPermissionPrompt from "@/components/NotificationPermissionPrompt"; // 추가

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
  // PWA 매니페스트 추가
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#2563eb', // 테마 컬러 추가
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
        <AuthProvider>
          <NotificationProvider>
            {children}
            <NotificationPermissionPrompt />
          </NotificationProvider>
        </AuthProvider>
      </body>
    </html>
  );
}