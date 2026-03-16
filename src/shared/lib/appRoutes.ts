export const APP_ROUTES = {
  // Authentication routes
  signIn: "/auth",
  signUp: "/auth/signup",
  invitedSignUp: "/auth/invite",
  forgetPassword: "/auth/forget-password",
  verifyOtp: "/auth/verify-otp",
  change: "/auth/change-password",
  notAuthorized: "/not-authorized",

  // Main app routes
  main: "/",

  // settins route
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