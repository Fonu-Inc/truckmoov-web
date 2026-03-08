import { Navigate } from "react-router-dom";
import type { FeatureRoute } from "@/shared/routing/route-types";
import {
  AUTH_NOT_AUTHORIZED_PATH,
  AUTH_ROOT_PATH,
  AUTH_SIGNIN_PATH,
} from "../domain/auth-routes";
import { AuthPageView, NotAuthorizedPageView } from "../ui/AuthPages";

export function buildAuthRoutes(defaultRoute: string): FeatureRoute[] {
  return [
    { path: AUTH_ROOT_PATH, element: <Navigate to={defaultRoute} replace /> },
    { path: AUTH_SIGNIN_PATH, element: <AuthPageView /> },
    { path: AUTH_NOT_AUTHORIZED_PATH, element: <NotAuthorizedPageView /> },
  ];
}
