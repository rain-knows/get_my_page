import { apiClient } from "@/lib/api-client";
import type { LoginRequest, LoginResponse, RegisterRequest } from "@/features/auth/types";

export async function login(request: LoginRequest): Promise<LoginResponse> {
  return apiClient.post<LoginResponse>("/auth/login", request);
}

export async function register(request: RegisterRequest): Promise<LoginResponse> {
  return apiClient.post<LoginResponse>("/auth/register", request);
}
