import type { ElementType } from "react";
import {
  BookOpen, ListChecks, Radio, Wrench,
} from "lucide-react";

export type InstallationTab = {
  to: string;
  label: string;
  icon: ElementType;
};

export const INSTALLATION_TABS: InstallationTab[] = [
  {
    to: "/installation", label: "Config Queue", icon: ListChecks,
  },
  {
    to: "/installation/installer-guide", label: "Installer Guide", icon: BookOpen,
  },
  {
    to: "/installation/verification", label: "Verification", icon: Radio,
  },
  {
    to: "/installation/troubleshooting", label: "Troubleshooting", icon: Wrench,
  },
];
