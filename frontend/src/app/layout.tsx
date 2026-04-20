import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { cn } from "@/lib/utils";
import { SpeedInsights } from "@vercel/speed-insights/next";

const inter = localFont({
  src: [
    { path: "../../public/fonts/GeistLatin-Regular.woff2", weight: "400", style: "normal" },
    { path: "../../public/fonts/GeistLatinExt-Regular.woff2", weight: "400", style: "normal" },
  ],
  variable: "--font-sans",
  display: "swap",
});

const spaceGrotesk = localFont({
  src: [
    { path: "../../public/fonts/GeistLatin-Regular.woff2", weight: "400", style: "normal" },
    { path: "../../public/fonts/GeistLatinExt-Regular.woff2", weight: "400", style: "normal" },
  ],
  variable: "--font-space-grotesk",
  display: "swap",
});

const archivo = localFont({
  src: [
    { path: "../../public/fonts/GeistLatin-Regular.woff2", weight: "400", style: "normal" },
    { path: "../../public/fonts/GeistLatinExt-Regular.woff2", weight: "400", style: "normal" },
  ],
  variable: "--font-archivo",
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
    <html lang="zh-CN" className={cn("dark", "font-sans", inter.variable)}>
      <body
        className={`${spaceGrotesk.className} ${archivo.variable} ${spaceGrotesk.variable} min-h-screen bg-(--gmp-bg-base) text-(--gmp-text-primary) antialiased selection:bg-(--gmp-accent)/30 selection:text-(--gmp-accent) overscroll-none`}
      >
        <div className="relative z-0 flex min-h-screen w-full flex-col">
          {children}
        </div>
        <SpeedInsights />
      </body>
    </html>
  );
}
