import axios, { AxiosError, InternalAxiosRequestConfig } from "axios"
import { useAuthStore } from "@/stores/authStore";
import { queryClient } from "@/shared/providers/TanstackQueryProvider";
import { APP_ROUTES } from "@/shared/lib/appRoutes";

type RetryRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

export type ServerSuccessResponse<T = null> = {
 status: true;
 message: string;
 data: T
}

export type ServerErrorResponse = {
 statusCode: number;
 message: string;
}

export const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL,
  headers: {
    "Content-Type": "application/json",
  },
})

const PUBLIC_ENDPOINTS = new Set([
  "/auth/login",
  "/auth/register",
  "/auth/refresh",
  "/auth/register/invited",
  "/auth/forget-password",
  "/auth/verify-reset",
  "/auth/reset-password",
]);

let refreshPromise: Promise<string | null> | null = null;

function isPublicEndpoint(url?: string) {
  return [...PUBLIC_ENDPOINTS].some((endpoint) => url?.includes(endpoint));
}

function handleExpiredSession() {
  useAuthStore.getState().logout();
  queryClient.clear();
}

axiosInstance.interceptors.request.use(
  (config) => {
    if (isPublicEndpoint(config.url)) return config;

    const { accessToken } = useAuthStore.getState();
    if (!accessToken) return config;

    config.headers!.Authorization = `Bearer ${accessToken}`;

    return config;
  },
  (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ServerErrorResponse>) => {
    const status = error?.response?.data.statusCode;
    const originalRequest = error?.config as RetryRequestConfig | undefined;

    if (status === 401 && originalRequest) {
      const requestUrl = String(originalRequest.url ?? "");
      const isExcluded = isPublicEndpoint(requestUrl);
      const hasRetried = Boolean(originalRequest._retry);

      if (isExcluded) {
        return Promise.reject(error);
      }
      if (hasRetried) {
        handleExpiredSession();
        return Promise.reject(error);
      }

      const { refreshToken, setTokens } = useAuthStore.getState();
      if (!refreshToken) {
        handleExpiredSession();
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
          originalRequest.headers!.Authorization = `Bearer ${nextAccessToken}`;
        }

        return axiosInstance(originalRequest);
      } catch (refreshError) {
        handleExpiredSession();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
