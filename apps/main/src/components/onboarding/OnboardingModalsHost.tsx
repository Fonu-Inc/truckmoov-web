import { WelcomeModal } from "./WelcomeModal";
import { useAuthStore } from "@/stores/authStore";

/**
 * Mounts the global welcome modal for newly-activated users.
 *
 * Flow has been simplified: only the Welcome modal is shown globally.
 * On "Get Started" the user is taken straight to Verify Business.
 */
export function OnboardingModalsHost() {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) return null;
  return <WelcomeModal />;
}
