import type { Metadata } from "next";
import { Fira_Code, JetBrains_Mono, Montserrat, Noto_Sans_SC, Oswald } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { ToastProvider } from "@/components/shared/ToastProvider";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-sans-base",
  display: "swap",
});

const notoSansSC = Noto_Sans_SC({
  weight: ["400", "500", "700", "900"],
  variable: "--font-sans-cjk",
  display: "swap",
});

const oswald = Oswald({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-heading-base",
  display: "swap",
});

const jetBrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "700", "800"],
  variable: "--font-mono-base",
  display: "swap",
});

const firaCode = Fira_Code({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-mono-accent",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Get My Page | 高质感数字博客",
  description: "采用 Next.js 驱动的现代化内容创造者平台",
  icons: {
    icon: "/gmp-logo.svg",
  },
};

/**
 * 功能：定义全站根布局与字体变量注入，统一暗色工业化主题的基础样式入口。
 * 关键参数：children 为当前路由注入的页面节点树。
 * 返回值/副作用：返回 HTML 根骨架；会为全站注入字体变量与基础样式类名。
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-CN"
      className={cn(
        "dark",
        "font-sans",
        montserrat.variable,
        notoSansSC.variable,
        oswald.variable,
        jetBrainsMono.variable,
        firaCode.variable,
      )}
    >
      <body
        className="min-h-screen bg-(--gmp-bg-base) text-(--gmp-text-primary) antialiased selection:bg-(--gmp-accent)/30 selection:text-(--gmp-accent) overscroll-none"
      >
        <div className="relative z-0 flex min-h-screen w-full flex-col">
          {children}
        </div>
        <ToastProvider />
        <SpeedInsights />
      </body>
    </html>
  );
}
