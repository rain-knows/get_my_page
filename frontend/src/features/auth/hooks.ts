import { useState } from "react";
import { ApiError } from "@/lib/api-client";
import { login, register } from "@/features/auth/api";
import { useAuthStore } from "@/stores/use-auth-store";
import type { LoginRequest, RegisterRequest } from "@/features/auth/types";

export function useAuthActions() {
  const setAuth = useAuthStore((s) => s.setAuth);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const run = async <T>(fn: () => Promise<T>): Promise<T> => {
    setError("");
    setLoading(true);
    try {
      return await fn();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("请求失败，请稍后重试");
      }
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    clearError: () => setError(""),
    login: async (request: LoginRequest) => {
      const data = await run(() => login(request));
      setAuth(data.user, data.accessToken, data.refreshToken);
      return data;
    },
    register: async (request: RegisterRequest) => {
      const data = await run(() => register(request));
      setAuth(data.user, data.accessToken, data.refreshToken);
      return data;
    },
  };
}
