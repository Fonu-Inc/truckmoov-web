import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router";
import { Button } from "@/components/shadcn/button";
import { canGoBack } from "../../utils/goBack";

/**
 * The single action on every status screen. Falls back to `/` when the screen
 * was opened directly, so the button never dead-ends — `/` resolves to the role
 * home in main (RoleHomeRedirect) and to the platform dashboard in admin, so no
 * per-app config is needed.
 */
export function GoBackButton() {
  const navigate = useNavigate();

  return (
    <Button
      variant="outline"
      onClick={() => (canGoBack()
        ? navigate(-1)
        : navigate(
            "/",
            { replace: true },
          ))}
    >
      <ArrowLeft className="mr-2 h-4 w-4" />
      Go back
    </Button>
  );
}
