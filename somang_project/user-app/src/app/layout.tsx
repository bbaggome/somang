import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";
import ErrorBoundary from "@/components/ErrorBoundary";
import { Suspense } from "react";

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
};

// viewport를 별도로 분리
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

// 로딩 컴포넌트 - Hydration 안전
function LoadingFallback() {
  return (
    <div className='flex items-center justify-center min-h-screen'>
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <p className="ml-3 text-gray-600">Loading...</p>
    </div>
  );
}

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
        <ErrorBoundary>
          <Suspense fallback={<LoadingFallback />}>
            <AuthProvider>
              {children}
            </AuthProvider>
          </Suspense>
        </ErrorBoundary>
      </body>
    </html>
  );
}