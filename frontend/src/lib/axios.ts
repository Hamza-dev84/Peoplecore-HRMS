import axios, { type AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from "axios";
import { config } from "./config";
import { AUTH_LOGOUT_EVENT, clearAccessToken, getAccessToken, setAccessToken } from "./token";
import type { ApiResponse } from "@/types/api";

export const api = axios.create({
  baseURL: config.apiUrl,
  withCredentials: true,
});

export const unwrap = <T>(response: AxiosResponse<ApiResponse<T>>): T => response.data.data;

export const toMessage = (response: AxiosResponse<ApiResponse<unknown>>): string =>
  response.data.message;

let refreshPromise: Promise<string> | null = null;

export const refreshAccessToken = (): Promise<string> => {
  if (!refreshPromise) {
    refreshPromise = axios
      .post<ApiResponse<{ accessToken: string }>>(`${config.apiUrl}/auth/refresh-token`, null, {
        withCredentials: true,
      })
      .then((response) => {
        const token = response.data.data.accessToken;
        setAccessToken(token);
        return token;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
};

const NO_REFRESH_URLS = ["/auth/login", "/auth/register", "/auth/refresh-token", "/auth/logout"];

api.interceptors.request.use((request) => {
  const token = getAccessToken();
  if (token) {
    request.headers.Authorization = `Bearer ${token}`;
  }
  return request;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;

    if (
      error.response?.status === 401 &&
      original &&
      !original._retry &&
      !NO_REFRESH_URLS.includes(original.url ?? "")
    ) {
      original._retry = true;

      try {
        const token = await refreshAccessToken();
        original.headers.Authorization = `Bearer ${token}`;
        return api(original);
      } catch (refreshError) {
        clearAccessToken();
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event(AUTH_LOGOUT_EVENT));
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);