import { toast } from "sonner";

export function deviceActionError(error: {
  statusCode?: number;
  message: string;
}) {
  toast.error(error.statusCode === 503 ? "Device service unreachable. Nothing changed. Try again." : error.message);
}
