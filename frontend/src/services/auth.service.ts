import { api, refreshAccessToken, toMessage, unwrap } from "@/lib/axios";
import { clearAccessToken, setAccessToken } from "@/lib/token";
import type { ApiResponse } from "@/types/api";
import type { AuthUser } from "@/types/user";

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

interface LoginData {
  user: AuthUser;
  accessToken: string;
}

export const authService = {
  async register(payload: RegisterPayload) {
    const response = await api.post<ApiResponse<{ user: AuthUser }>>("/auth/register", payload);
    return { user: response.data.data.user, message: response.data.message };
  },

  async login(payload: LoginPayload): Promise<LoginData> {
    const data = await api.post<ApiResponse<LoginData>>("/auth/login", payload).then(unwrap);
    setAccessToken(data.accessToken);
    return data;
  },

  async logout(): Promise<void> {
    try {
      await api.post("/auth/logout");
    } finally {
      clearAccessToken();
    }
  },

  refreshSession: refreshAccessToken,

  async getMe(): Promise<AuthUser> {
    const data = await api.get<ApiResponse<{ user: AuthUser }>>("/auth/me").then(unwrap);
    return data.user;
  },

  verifyEmail: (token: string) =>
    api.post<ApiResponse<null>>("/auth/verify-email", { token }).then(toMessage),

  resendVerification: (email: string) =>
    api.post<ApiResponse<null>>("/auth/resend-verification", { email }).then(toMessage),

  forgotPassword: (email: string) =>
    api.post<ApiResponse<null>>("/auth/forgot-password", { email }).then(toMessage),

  resetPassword: (token: string, password: string) =>
    api.post<ApiResponse<null>>("/auth/reset-password", { token, password }).then(toMessage),

  changePassword: (currentPassword: string, newPassword: string) =>
    api
      .patch<ApiResponse<null>>("/auth/change-password", { currentPassword, newPassword })
      .then(toMessage),
};