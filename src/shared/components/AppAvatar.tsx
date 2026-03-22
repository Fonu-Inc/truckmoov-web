import { Avatar } from "@radix-ui/react-avatar";
import { getNameInitials } from "../composables/getNameInitials";
import { AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

type AppAvatarProp = {
 value: string
 imgUrl?: string;
 className?: string;
}

export default function AppAvatar({ value, imgUrl, className }: AppAvatarProp) {
 return (
  <Avatar asChild>
   <div className={cn(
    "h-9 w-9 rounded-full",
    className
   )}>
    {imgUrl && (
     <AvatarImage src={imgUrl} className="object-contain" />
    )}
    <AvatarFallback className="bg-primary text-primary-foreground font-semibold text-sm">
     {getNameInitials(value)}
    </AvatarFallback>
   </div>
  </Avatar>
 )
}
