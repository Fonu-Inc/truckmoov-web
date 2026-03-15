import { getNameInitials } from "../composables/getNameInitials";

type AppAvatarProp = {
 value: string
}

export default function AppAvatar({value}: AppAvatarProp) {
 return (
  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold text-sm">
   {getNameInitials(value)}
  </div>
 )
}
