import type { Metadata, Viewport } from "next";
import { AuthProvider } from "@/components/AuthProvider";
import { Header } from "@/components/Header";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "붕세권 — 내 주변 붕어빵·닭꼬치·포장마차 지도", template: "%s | 붕세권" },
  description: "내 주변 붕어빵, 닭꼬치, 포장마차의 위치와 남은 메뉴 수량을 지도에서 한눈에 확인하세요.",
};

export const viewport: Viewport = { themeColor: "#ea580c" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <AuthProvider>
          <Header />
          <main className="flex flex-1 flex-col">{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
