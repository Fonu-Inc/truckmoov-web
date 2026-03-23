export const APP_ROUTES = {
  // Authentication routes
  signIn: "/auth",
  signUp: "/auth/signup",
  invitedSignUp: "/auth/invite",
  forgetPassword: "/auth/forget-password",
  verifyEmail: "/auth/verify-email",
  verifyRequest: "/auth/verify-request",
  change: "/auth/change-password",
  notAuthorized: "/not-authorized",

  // Main app routes
  main: "/",
  dashboard: "/dashboard",
  jobs: "/jobs",
  fleet: "/fleet",
  map: "/map",
  settlement: "/settlement",
  reports: "/reports",
  integrations: "/integrations",
  driver: "/driver",
  device: "/device",

  // settings route
  organizationsSettings: "/setting",
  subscriptionSettings: "/setting/subscription",
  kycSettings: "/setting/kyc",
  fleetSettings: "/setting/fleet",
  aiMatchingSettings: "/setting/ai-matching",
  aiUsageSettings: "/setting/ai-usage",
  notificationSettings: "/setting/notifications",
  communicationSettings: "/setting/communication",
  userSettings: "/setting/user",
  brandingSettings: "/setting/branding",
  integrationsSettings: "/setting/integrations"
}