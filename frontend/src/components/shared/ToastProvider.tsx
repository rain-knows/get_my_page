"use client";

import { Toaster } from "sonner";

/**
 * 功能：封装 sonner Toaster 为独立客户端组件，供服务端 layout.tsx 引用。
 * 关键参数：无。
 * 返回值/副作用：渲染 sonner 全局通知容器；无副作用。
 */
export function ToastProvider() {
    return (
        <Toaster
            position="top-right"
            toastOptions={{
                style: {
                    background: "var(--gmp-bg-panel)",
                    border: "1px solid var(--gmp-line-strong)",
                    color: "var(--gmp-text-primary)",
                    fontFamily: "var(--font-mono-base), monospace",
                    fontSize: "11px",
                    fontWeight: "700",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    borderRadius: "0",
                },
            }}
        />
    );
}
