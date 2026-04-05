import type { Metadata } from "next";
import { Archivo, Space_Grotesk } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({ 
  subsets: ["latin"],
  variable: "--font-space-grotesk" 
});

const archivo = Archivo({ 
  subsets: ["latin"],
  variable: "--font-archivo"
});

export const metadata: Metadata = {
  title: "Get My Page | 高质感数字博客",
  description: "采用 Next.js 驱动的现代化内容创造者平台",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="dark">
      <body
        className={`${spaceGrotesk.className} ${archivo.variable} ${spaceGrotesk.variable} min-h-screen bg-neutral-950 text-neutral-100 antialiased selection:bg-blue-500/30 selection:text-blue-200 overscroll-none`}
      >
        {children}
      </body>
    </html>
  );
}
