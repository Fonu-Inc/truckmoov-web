import axios, { AxiosError, InternalAxiosRequestConfig } from "axios"
import { useAuthStore } from "@/stores/authStore";

type RetryRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

export type ServerSuccessResponse<T = null> = {
 status: true;
 message: string;
 data: T
}

export type ServerErrorResponse = {
 status: false;
 message: string;
}

export const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL,
  headers: {
    "Content-Type": "application/json",
    // "ngrok-skip-browser-warning": "true",
  },
})

const AUTH_HEADER_EXCLUDED_ENDPOINTS = [
  "/auth/register",
  "/auth/refresh",
];

let refreshPromise: Promise<string | null> | null = null;

axiosInstance.interceptors.request.use(
  (config) => {
    const isExcluded = AUTH_HEADER_EXCLUDED_ENDPOINTS.some((endpoint) =>
      config.url?.includes(endpoint)
    );

    if (isExcluded) return config;

    const { accessToken } = useAuthStore.getState();
    if (!accessToken) return config;

    config.headers = config.headers!;
    config.headers.Authorization = `Bearer ${accessToken}`;

    return config;
  },
  (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const status = error?.response?.status;
    const originalRequest = error?.config as RetryRequestConfig | undefined;

    if (status === 401 && originalRequest) {
      const requestUrl = String(originalRequest.url ?? "");
      const isRefreshRequest = requestUrl.includes("/auth/refresh");
      const hasRetried = Boolean(originalRequest._retry);

      if (isRefreshRequest || hasRetried) {
        useAuthStore.getState().logout();
        return Promise.reject(error);
      }

      const { refreshToken, setTokens, logout } = useAuthStore.getState();
      if (!refreshToken) {
        logout();
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      try {
        if (!refreshPromise) {
          refreshPromise = import("@/features/auth/api/requests")
            .then(({ getNewAccessToken }) =>
              getNewAccessToken({
                data: { refreshToken },
              })
            )
            .then((response) => {
              const nextAccessToken = response.data.accessToken;
              const nextRefreshToken = response.data.refreshToken;
              setTokens({
                accessToken: nextAccessToken,
                refreshToken: nextRefreshToken,
              });
              return nextAccessToken;
            })
            .finally(() => {
              refreshPromise = null;
            });
        }

        const nextAccessToken = await refreshPromise;
        if (nextAccessToken) {
          originalRequest.headers = originalRequest.headers!;
          originalRequest.headers.Authorization = `Bearer ${nextAccessToken}`;
        }

        return axiosInstance(originalRequest);
      } catch (refreshError) {
        logout();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
