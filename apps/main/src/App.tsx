import React, { useEffect } from "react";
import { Toaster as Sonner } from "@/components/shadcn/sonner";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@truckmoov/api/lib/query-client";
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "./stores/authStore";
import { getPostLoginRedirectPath } from "./lib/authRedirect";
import { CurrencyProvider } from "./contexts/CurrencyContext";
import { PreferencesProvider } from "./contexts/PreferencesContext";
import { TenantBrandingProvider } from "./contexts/TenantBrandingContext";
import { ThemeProvider } from "./components/ThemeProvider";
import { FonuCallProvider } from "./contexts/FonuCallContext";
import { KeyboardShortcutsDialog } from "./components/KeyboardShortcutsDialog";
import { GlobalSupportChat } from "./components/support/GlobalSupportChat";

// Pages
import AuthPage from "./pages/AuthPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPassword from "./pages/ResetPassword";
import SignUpPage from "./pages/SignUpPage";
import NotAuthorized from "./pages/NotAuthorized";
import TenantAdminDashboard from "./pages/admin/TenantAdminDashboard";
import FleetManagement from "./pages/admin/FleetManagement";
import DriverManagement from "./pages/admin/DriverManagement";
import DeviceManagement from "./pages/admin/DeviceManagement";
import SIMManagement from "./pages/admin/SIMManagement";

import JobDispatch from "./pages/admin/JobDispatch";
import MessagingCenter from "./pages/admin/MessagingCenter";
import Reports from "./pages/admin/Reports";
import LiveMap from "./pages/admin/LiveMap";
import DriverBehaviorDashboard from "./pages/admin/DriverBehaviorDashboard";
import DriverFatigueDashboard from "./pages/admin/DriverFatigueDashboard";
import Settings from "./pages/admin/Settings";
import TenantWallet from "./pages/admin/TenantWallet";
import DataBundles from "./pages/admin/DataBundles";
import SupervisorDashboard from "./pages/supervisor/SupervisorDashboard";
import SupervisorLiveMap from "./pages/supervisor/SupervisorLiveMap";
import SupervisorDispatch from "./pages/supervisor/SupervisorDispatch";

import SupervisorDrivers from "./pages/supervisor/SupervisorDrivers";
import SupervisorAlerts from "./pages/supervisor/SupervisorAlerts";
import SupervisorMessages from "./pages/supervisor/SupervisorMessages";
import SupervisorReports from "./pages/supervisor/SupervisorReports";
import DriverInterface from "./pages/driver/DriverInterface";
import DebugMap from "./pages/debug/DebugMap";
import DeviceInstallation from "./pages/admin/DeviceInstallation";
import Integrations from "./pages/admin/Integrations";
import JobOffers from "./pages/admin/JobOffers";
import OmnichannelInbox from "./pages/admin/OmnichannelInbox";
import Architecture from "./pages/Architecture";
import TechnicalArchitecture from "./pages/TechnicalArchitecture";
import HelpSupport from "./pages/support/HelpSupport";
import EnterpriseLogisticsDashboard from "./pages/enterprise/EnterpriseLogisticsDashboard";
import AggregatorDashboard from "./pages/aggregator/AggregatorDashboard";
import OwnerOperatorDashboard from "./pages/owner-operator/OwnerOperatorDashboard";
import OwnerOperatorVehicleDetail from "./pages/owner-operator/OwnerOperatorVehicleDetail";
import OwnerOperatorVehicles from "./pages/owner-operator/OwnerOperatorVehicles";
import OwnerOperatorDocuments from "./pages/owner-operator/OwnerOperatorDocuments";
import OwnerOperatorJobs from "./pages/owner-operator/OwnerOperatorJobs";
import NotFound from "./pages/NotFound";
import WaybillInvoices from "./pages/admin/WaybillInvoices";
import SubscriptionInvoices from "./pages/admin/SubscriptionInvoices";
import Sustainability from "./pages/admin/Sustainability";
import VehiclePLStatementPreview from "./pages/admin/VehiclePLStatementPreview";
import KycOnboarding from "./pages/onboarding/KycOnboarding";
import ActivationOnboarding from "./pages/onboarding/ActivationOnboarding";
import SubscriptionOnboarding from "./pages/onboarding/SubscriptionOnboarding";
import WelcomeDashboard from "./pages/onboarding/WelcomeDashboard";

// Dispatcher Portal (independent — do not share with Supervisor/Admin)
import DispatcherDashboard from "./pages/dispatcher/DispatcherDashboard";
import DispatcherDispatch from "./pages/dispatcher/DispatcherDispatch";
import DispatcherLiveMap from "./pages/dispatcher/DispatcherLiveMap";
import DispatcherDrivers from "./pages/dispatcher/DispatcherDrivers";
import DispatcherDevices from "./pages/dispatcher/DispatcherDevices";
import DispatcherSIMs from "./pages/dispatcher/DispatcherSIMs";
import DispatcherAlerts from "./pages/dispatcher/DispatcherAlerts";
import DispatcherMessages from "./pages/dispatcher/DispatcherMessages";
import DispatcherInbox from "./pages/dispatcher/DispatcherInbox";
import DispatcherReports from "./pages/dispatcher/DispatcherReports";

function RoleHomeRedirect() {
  const user = useAuthStore((s) => s.user);
  return <Navigate to={getPostLoginRedirectPath(user!.role)} replace />;
}

function ProtectedRoute() {
  const location = useLocation();
  const { isAuthenticated, isAuthReady } = useAuthStore();

  if (!isAuthReady) {
    return null;
  }

  if (!isAuthenticated && !location.pathname.startsWith("/auth")) {
    return <Navigate to="/auth" replace state={{ from: location }} />;
  }

  return <Outlet />;
}

const App = () => {
  useEffect(() => {
    void useAuthStore.getState().bootstrapFromSession();
  }, []);

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange>
      <QueryClientProvider client={queryClient}>
        <CurrencyProvider>
          <PreferencesProvider>
            <TenantBrandingProvider>
              <Sonner />
              {/* <KeyboardShortcutsDialog /> */}
              <FonuCallProvider>
                <BrowserRouter>
                  <Routes>
                    <Route path="/auth" element={<AuthPage />} />
                    <Route path="/auth/signup" element={<SignUpPage />} />
                    <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
                    <Route path="/auth/reset-password" element={<ResetPassword />} />

                    <Route element={<ProtectedRoute />}>
                      <Route path="/" element={<RoleHomeRedirect />} />
                      <Route path="/not-authorized" element={<NotAuthorized />} />

                      {/* Onboarding Pages */}
                      <Route path="/onboarding" element={<SubscriptionOnboarding />} />
                      <Route path="/onboarding/kyc" element={<KycOnboarding />} />
                      <Route path="/onboarding/activate" element={<ActivationOnboarding />} />
                      <Route path="/onboarding/quick-access" element={<WelcomeDashboard />} />

                      {/* Enterprise Routes */}
                      <Route path="/enterprise" element={<EnterpriseLogisticsDashboard />} />

                      {/* Aggregator Routes */}
                      <Route path="/aggregator" element={<AggregatorDashboard />} />

                      {/* Owner-Operator Routes */}
                      <Route path="/owner-operator" element={<OwnerOperatorDashboard />} />
                      <Route path="/owner-operator/vehicle/:vehicleId" element={<OwnerOperatorVehicleDetail />} />
                      <Route path="/owner-operator/vehicles" element={<OwnerOperatorVehicles />} />
                      <Route path="/owner-operator/documents" element={<OwnerOperatorDocuments />} />
                      <Route path="/owner-operator/jobs" element={<OwnerOperatorJobs />} />

                      {/* Tenant Admin / Fleet Provider Routes */}
                      <Route path="/admin" element={<TenantAdminDashboard />} />
                      <Route path="/admin/fleet" element={<FleetManagement />} />
                      <Route path="/admin/drivers" element={<DriverManagement />} />
                      <Route path="/admin/devices" element={<DeviceManagement />} />
                      <Route path="/admin/sims" element={<SIMManagement />} />
                      <Route path="/admin/data-bundles" element={<DataBundles />} />

                      <Route path="/admin/jobs" element={<JobDispatch />} />
                      <Route path="/admin/ivr-dashboard" element={<Navigate to="/admin/messages?tab=ivr-dashboard" replace />} />
                      <Route path="/admin/analytics" element={<Navigate to="/admin/fleet?tab=analytics" replace />} />
                      <Route path="/admin/map" element={<LiveMap />} />
                      <Route path="/admin/behavior" element={<DriverBehaviorDashboard />} />
                      <Route path="/admin/fatigue" element={<DriverFatigueDashboard />} />
                      <Route path="/admin/messages" element={<MessagingCenter />} />
                      <Route path="/admin/inbox" element={<OmnichannelInbox />} />
                      <Route path="/admin/maintenance" element={<Navigate to="/admin/fleet?tab=maintenance" replace />} />
                      <Route path="/admin/fuel" element={<Navigate to="/admin/fleet?tab=fuel" replace />} />
                      <Route path="/admin/compliance" element={<Navigate to="/admin/fleet?tab=compliance" replace />} />
                      <Route path="/admin/wallet" element={<TenantWallet />} />
                      <Route path="/admin/installation" element={<DeviceInstallation />} />
                      <Route path="/admin/integrations" element={<Integrations />} />
                      <Route path="/admin/job-offers" element={<JobOffers />} />
                      <Route path="/admin/subscription" element={<Navigate to="/admin/settings?tab=subscription" replace />} />
                      <Route path="/admin/reports" element={<Reports />} />
                      <Route path="/admin/waybill-invoices" element={<WaybillInvoices />} />
                      <Route path="/admin/subscription-invoices" element={<SubscriptionInvoices />} />
                      <Route path="/admin/sustainability" element={<Sustainability />} />
                      <Route path="/admin/fleet/pl-statement" element={<VehiclePLStatementPreview />} />
                      <Route path="/admin/settings" element={<Settings />} />

                      {/* Supervisor Routes */}
                      <Route path="/supervisor" element={<SupervisorDashboard />} />
                      <Route path="/supervisor/map" element={<SupervisorLiveMap />} />
                      <Route path="/supervisor/dispatch" element={<SupervisorDispatch />} />
                      <Route path="/supervisor/drivers" element={<SupervisorDrivers />} />
                      <Route path="/supervisor/alerts" element={<SupervisorAlerts />} />
                      <Route path="/supervisor/messages" element={<SupervisorMessages />} />
                      <Route path="/supervisor/inbox" element={<OmnichannelInbox />} />
                      <Route path="/supervisor/reports" element={<SupervisorReports />} />
                      <Route path="/supervisor/*" element={<SupervisorDashboard />} />

                      {/* Dispatcher Portal Routes (independent) */}
                      <Route path="/dispatcher" element={<DispatcherDashboard />} />
                      <Route path="/dispatcher/dispatch" element={<DispatcherDispatch />} />
                      <Route path="/dispatcher/map" element={<DispatcherLiveMap />} />
                      <Route path="/dispatcher/drivers" element={<DispatcherDrivers />} />
                      <Route path="/dispatcher/devices" element={<DispatcherDevices />} />
                      <Route path="/dispatcher/sims" element={<DispatcherSIMs />} />
                      <Route path="/dispatcher/alerts" element={<DispatcherAlerts />} />
                      <Route path="/dispatcher/messages" element={<DispatcherMessages />} />
                      <Route path="/dispatcher/inbox" element={<DispatcherInbox />} />
                      <Route path="/dispatcher/reports" element={<DispatcherReports />} />
                      <Route path="/dispatcher/*" element={<DispatcherDashboard />} />

                      {/* Debug Route - No auth, no layout */}
                      <Route path="/debug/map" element={<DebugMap />} />

                      {/* Architecture Documentation - Public */}
                      <Route path="/architecture" element={<Architecture />} />
                      <Route path="/technical-architecture" element={<TechnicalArchitecture />} />

                      {/* Help & Support */}
                      <Route path="/help" element={<HelpSupport />} />

                      <Route path="*" element={<NotFound />} />
                    </Route>
                  </Routes>
                  <GlobalSupportChat />
                </BrowserRouter>
              </FonuCallProvider>
            </TenantBrandingProvider>
          </PreferencesProvider>
        </CurrencyProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
};

export default App;
