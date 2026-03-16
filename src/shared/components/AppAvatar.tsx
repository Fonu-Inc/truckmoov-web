import { Avatar } from "@radix-ui/react-avatar";
import { getNameInitials } from "../composables/getNameInitials";
import { AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type AppAvatarProp = {
 value: string
 imgUrl?: string;
}

export default function AppAvatar({ value, imgUrl }: AppAvatarProp) {
 return (
  <Avatar asChild>
   <div className="h-9 w-9 rounded-full">
    <AvatarImage src={imgUrl ?? null} className="object-contain" />
    <AvatarFallback className="bg-primary text-primary-foreground font-semibold text-sm">
     {getNameInitials(value)}
    </AvatarFallback>
   </div>
  </Avatar>
 )
}
