import { useLogout } from "@/features/auth/api";
import { useAuthStore } from "@/stores/authStore";
import { Loader, LogOut } from "lucide-react";
import { toast } from "sonner";

type SignOutButton = {
 collapsed?: boolean
}

export default function SignOutButton({ collapsed = false }) {
 const { logout, refreshToken } = useAuthStore()
 const { mutateAsync, isPending } = useLogout()

 const handleClick = async () => {
  await mutateAsync({
   data: {
    refreshToken,
   }
  }, {
   onSuccess: () => {
    logout()
    toast.success("Logout Successful", {
     description: "Bye, Come back soon"
    })
   }
  })
 }

 return (
  <button
   onClick={handleClick}
   className="flex w-full cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-sm text-destructive/80 hover:bg-destructive/10 hover:text-destructive transition-colors"
   disabled={isPending}
  >
   {isPending ? <Loader className="animate-spin h-4.5 w-4.5" /> : <LogOut className="h-4.5 w-4.5" />}
   {!collapsed && (
    <span>Sign Out</span>
   )}
  </button>
 )
}
