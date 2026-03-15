import { NavLink, useLocation } from "react-router-dom";
import { SidebarListItem } from "../lib/sidebarListItem";
import { cn } from "@/lib/utils";
import { UserRole } from "@/features/auth/api/types";
import { ClassValue } from "clsx";
import { useState } from "react";
import { TooltipWrapper } from "@/components/ui/tooltip-wrapper";
import { ChevronDown } from "lucide-react";

type MainNavItemsProps = {
 collapsed: boolean;
 userRole: UserRole;
 navList: SidebarListItem;
 className?: ClassValue;
};

export default function MainNavItems({ className, navList, collapsed, userRole }: MainNavItemsProps) {
 const location = useLocation();
 const Icon = navList.icon;
 const [targetPath, targetQuery] = navList.to.split("?");
 const currentQuery = location.search.startsWith("?")
  ? location.search.slice(1)
  : location.search;
 const matchesPath =
  location.pathname === targetPath ||
  (targetPath !== "/" && location.pathname.startsWith(`${targetPath}/`));
 const isActive = matchesPath && (!targetQuery || currentQuery === targetQuery);
 const [expanded, setExpanded] = useState(false)

 function expandLink(e) {
  e.stopPropagation()
  setExpanded(prev => !prev)
 }

 const navContent = (
  <div>
   <NavLink
    key={navList.to}
    to={navList.to}
    className={cn(
     "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-all duration-150",
     isActive
      ? "bg-primary/10 text-primary border-l-2 border-primary ml-0 pl-2.5"
      : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
     className,
    )}
   >
    <Icon className={cn("h-4.5 w-4.5 shrink-0", isActive && "text-primary")} />
    {!collapsed && (
     <div className="flex items-center justify-between w-full">
      <span className="flex-1">{navList.label}</span>
      {navList.items && (
       <ChevronDown
        onClick={expandLink}
        className={cn(
         "h-5 w-5 shrink-0 transition-transform duration-200",
         expanded && "rotate-180"
        )}
       />
      )}
     </div>
    )}
   </NavLink>
   {
    expanded && navList.items && navList.items.map(item => (
     <MainNavItems
      key={item.to}
      className="ml-2.5"
      navList={item}
      collapsed={collapsed}
      userRole={userRole}
     />
    ))
   }
  </div>
 );

 return (
  <>
   {
    navList.roleWithAccess.includes(userRole) && (
     <TooltipWrapper content={navList.label} side="right" displayCondition={collapsed}>
      {navContent}
     </TooltipWrapper>
    )
   }
  </>
 );
}
