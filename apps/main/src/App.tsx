import React, { useEffect } from "react";
import { Toaster as Sonner } from "@/components/shadcn/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "./stores/authStore";
import { OrgProtectedRoute } from "./components/layout/OrgProtectedRoute";
import { supabase } from "@/integrations/supabase/client";
import { setToken, clearToken } from "@/lib/backendApi";
import { CurrencyProvider } from "./contexts/CurrencyContext";
import { PreferencesProvider } from "./contexts/PreferencesContext";
import { TenantBrandingProvider } from "./contexts/TenantBrandingContext";
import { ThemeProvider } from "./components/ThemeProvider";
import { FonuCallProvider } from "./contexts/FonuCallContext";
import { KeyboardShortcutsDialog } from "./components/KeyboardShortcutsDialog";
import { GlobalSupportChat } from "./components/support/GlobalSupportChat";
import { OnboardingModalsHost } from "./components/onboarding/OnboardingModalsHost";

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
import DriverIVRDashboard from "./pages/admin/DriverIVRDashboard";
import MessagingCenter from "./pages/admin/MessagingCenter";
import Analytics from "./pages/admin/Analytics";
import Reports from "./pages/admin/Reports";
import LiveMap from "./pages/admin/LiveMap";
import DriverBehaviorDashboard from "./pages/admin/DriverBehaviorDashboard";
import DriverFatigueDashboard from "./pages/admin/DriverFatigueDashboard";
import MaintenanceManagement from "./pages/admin/MaintenanceManagement";
import FuelManagement from "./pages/admin/FuelManagement";
import ComplianceManagement from "./pages/admin/ComplianceManagement";
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

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      const demoRole = sessionStorage.getItem('fleetpro_demo_role');
      if (demoRole) return;

      if (session?.access_token) {
        setToken(session.access_token);
      } else if (_event === 'SIGNED_OUT') {
        clearToken();
      }

      void useAuthStore.getState().bootstrapFromSession();
    });

    void useAuthStore.getState().bootstrapFromSession();

    return () => {
      data.subscription.unsubscribe();
    };
  }, []);

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange>
      <QueryClientProvider client={queryClient}>
        <CurrencyProvider>
          <PreferencesProvider>
          <TenantBrandingProvider>
          <Sonner />
          <KeyboardShortcutsDialog />
          <FonuCallProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Navigate to="/auth" replace />} />
                <Route path="/auth" element={<AuthPage />} />
                <Route path="/auth/signup" element={<SignUpPage />} />
                <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/not-authorized" element={<NotAuthorized />} />

                {/* Onboarding Pages */}
                <Route path="/onboarding/subscription" element={<OrgProtectedRoute><SubscriptionOnboarding /></OrgProtectedRoute>} />
                <Route path="/onboarding/kyc" element={<OrgProtectedRoute><KycOnboarding /></OrgProtectedRoute>} />
                <Route path="/onboarding/activate" element={<OrgProtectedRoute><ActivationOnboarding /></OrgProtectedRoute>} />
                <Route path="/onboarding/quick-access" element={<OrgProtectedRoute><WelcomeDashboard /></OrgProtectedRoute>} />
                <Route path="/onboarding/welcome" element={<Navigate to="/onboarding/subscription" replace />} />
                
                {/* Enterprise Routes */}
                <Route path="/enterprise" element={<OrgProtectedRoute><EnterpriseLogisticsDashboard /></OrgProtectedRoute>} />
                
                {/* Aggregator Routes */}
                <Route path="/aggregator" element={<OrgProtectedRoute><AggregatorDashboard /></OrgProtectedRoute>} />
                
                {/* Owner-Operator Routes */}
                <Route path="/owner-operator" element={<OrgProtectedRoute><OwnerOperatorDashboard /></OrgProtectedRoute>} />
                <Route path="/owner-operator/vehicle/:vehicleId" element={<OrgProtectedRoute><OwnerOperatorVehicleDetail /></OrgProtectedRoute>} />
                <Route path="/owner-operator/vehicles" element={<OrgProtectedRoute><OwnerOperatorVehicles /></OrgProtectedRoute>} />
                <Route path="/owner-operator/documents" element={<OrgProtectedRoute><OwnerOperatorDocuments /></OrgProtectedRoute>} />
                <Route path="/owner-operator/jobs" element={<OrgProtectedRoute><OwnerOperatorJobs /></OrgProtectedRoute>} />
                
                {/* Tenant Admin / Fleet Provider Routes */}
                <Route path="/admin" element={<OrgProtectedRoute><TenantAdminDashboard /></OrgProtectedRoute>} />
                <Route path="/admin/fleet" element={<OrgProtectedRoute><FleetManagement /></OrgProtectedRoute>} />
                <Route path="/admin/drivers" element={<OrgProtectedRoute><DriverManagement /></OrgProtectedRoute>} />
                <Route path="/admin/devices" element={<OrgProtectedRoute><DeviceManagement /></OrgProtectedRoute>} />
                <Route path="/admin/sims" element={<OrgProtectedRoute><SIMManagement /></OrgProtectedRoute>} />
                <Route path="/admin/data-bundles" element={<OrgProtectedRoute><DataBundles /></OrgProtectedRoute>} />
                
                <Route path="/admin/jobs" element={<OrgProtectedRoute><JobDispatch /></OrgProtectedRoute>} />
                <Route path="/admin/ivr-dashboard" element={<Navigate to="/admin/messages?tab=ivr-dashboard" replace />} />
                <Route path="/admin/analytics" element={<Navigate to="/admin/fleet?tab=analytics" replace />} />
                <Route path="/admin/map" element={<OrgProtectedRoute><LiveMap /></OrgProtectedRoute>} />
                <Route path="/admin/behavior" element={<OrgProtectedRoute><DriverBehaviorDashboard /></OrgProtectedRoute>} />
                <Route path="/admin/fatigue" element={<OrgProtectedRoute><DriverFatigueDashboard /></OrgProtectedRoute>} />
                <Route path="/admin/messages" element={<OrgProtectedRoute><MessagingCenter /></OrgProtectedRoute>} />
                <Route path="/admin/inbox" element={<OrgProtectedRoute><OmnichannelInbox /></OrgProtectedRoute>} />
                <Route path="/admin/maintenance" element={<Navigate to="/admin/fleet?tab=maintenance" replace />} />
                <Route path="/admin/fuel" element={<Navigate to="/admin/fleet?tab=fuel" replace />} />
                <Route path="/admin/compliance" element={<Navigate to="/admin/fleet?tab=compliance" replace />} />
                <Route path="/admin/wallet" element={<OrgProtectedRoute><TenantWallet /></OrgProtectedRoute>} />
                <Route path="/admin/installation" element={<OrgProtectedRoute><DeviceInstallation /></OrgProtectedRoute>} />
                <Route path="/admin/integrations" element={<OrgProtectedRoute><Integrations /></OrgProtectedRoute>} />
                <Route path="/admin/job-offers" element={<OrgProtectedRoute><JobOffers /></OrgProtectedRoute>} />
                <Route path="/admin/subscription" element={<Navigate to="/admin/settings?tab=subscription" replace />} />
                <Route path="/admin/reports" element={<OrgProtectedRoute><Reports /></OrgProtectedRoute>} />
                <Route path="/admin/waybill-invoices" element={<OrgProtectedRoute><WaybillInvoices /></OrgProtectedRoute>} />
                <Route path="/admin/subscription-invoices" element={<OrgProtectedRoute><SubscriptionInvoices /></OrgProtectedRoute>} />
                <Route path="/admin/sustainability" element={<OrgProtectedRoute><Sustainability /></OrgProtectedRoute>} />
                <Route path="/admin/fleet/pl-statement" element={<VehiclePLStatementPreview />} />
                <Route path="/admin/settings" element={<OrgProtectedRoute><Settings /></OrgProtectedRoute>} />
                
                {/* Supervisor Routes */}
                <Route path="/supervisor" element={<OrgProtectedRoute><SupervisorDashboard /></OrgProtectedRoute>} />
                <Route path="/supervisor/map" element={<OrgProtectedRoute><SupervisorLiveMap /></OrgProtectedRoute>} />
                <Route path="/supervisor/dispatch" element={<OrgProtectedRoute><SupervisorDispatch /></OrgProtectedRoute>} />
                
                <Route path="/supervisor/drivers" element={<OrgProtectedRoute><SupervisorDrivers /></OrgProtectedRoute>} />
                <Route path="/supervisor/alerts" element={<OrgProtectedRoute><SupervisorAlerts /></OrgProtectedRoute>} />
                <Route path="/supervisor/messages" element={<OrgProtectedRoute><SupervisorMessages /></OrgProtectedRoute>} />
                <Route path="/supervisor/inbox" element={<OrgProtectedRoute><OmnichannelInbox /></OrgProtectedRoute>} />
                <Route path="/supervisor/reports" element={<OrgProtectedRoute><SupervisorReports /></OrgProtectedRoute>} />
                <Route path="/supervisor/*" element={<OrgProtectedRoute><SupervisorDashboard /></OrgProtectedRoute>} />

                {/* Dispatcher Portal Routes (independent) */}
                <Route path="/dispatcher" element={<OrgProtectedRoute><DispatcherDashboard /></OrgProtectedRoute>} />
                <Route path="/dispatcher/dispatch" element={<OrgProtectedRoute><DispatcherDispatch /></OrgProtectedRoute>} />
                <Route path="/dispatcher/map" element={<OrgProtectedRoute><DispatcherLiveMap /></OrgProtectedRoute>} />
                <Route path="/dispatcher/drivers" element={<OrgProtectedRoute><DispatcherDrivers /></OrgProtectedRoute>} />
                <Route path="/dispatcher/devices" element={<OrgProtectedRoute><DispatcherDevices /></OrgProtectedRoute>} />
                <Route path="/dispatcher/sims" element={<OrgProtectedRoute><DispatcherSIMs /></OrgProtectedRoute>} />
                <Route path="/dispatcher/alerts" element={<OrgProtectedRoute><DispatcherAlerts /></OrgProtectedRoute>} />
                <Route path="/dispatcher/messages" element={<OrgProtectedRoute><DispatcherMessages /></OrgProtectedRoute>} />
                <Route path="/dispatcher/inbox" element={<OrgProtectedRoute><DispatcherInbox /></OrgProtectedRoute>} />
                <Route path="/dispatcher/reports" element={<OrgProtectedRoute><DispatcherReports /></OrgProtectedRoute>} />
                <Route path="/dispatcher/*" element={<OrgProtectedRoute><DispatcherDashboard /></OrgProtectedRoute>} />

                {/* Driver Interface */}
                <Route path="/driver" element={<OrgProtectedRoute><DriverInterface /></OrgProtectedRoute>} />
                
                {/* Debug Route - No auth, no layout */}
                <Route path="/debug/map" element={<DebugMap />} />
                
                {/* Architecture Documentation - Public */}
                <Route path="/architecture" element={<Architecture />} />
                <Route path="/technical-architecture" element={<TechnicalArchitecture />} />
                
                {/* Help & Support */}
                <Route path="/help" element={<HelpSupport />} />
                
                <Route path="*" element={<NotFound />} />
              </Routes>
              <GlobalSupportChat />
              <div data-allow-no-subscription data-allow-no-kyc>
                <OnboardingModalsHost />
              </div>
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
