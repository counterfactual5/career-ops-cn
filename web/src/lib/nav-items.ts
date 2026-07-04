import {
  LayoutDashboard,
  ListChecks,
  BarChart3,
  FileText,
  Settings,
} from "lucide-react";
import type { ComponentType, SVGProps } from "react";

// Single source of truth for the app's primary destinations — shared by the
// desktop sidebar and the mobile nav so they can never drift.
export type NavItem = {
  href: string;
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  chip?: string;
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "今日", icon: LayoutDashboard },
  { href: "/pipeline", label: "待办", icon: ListChecks },
  { href: "/analytics", label: "分析", icon: BarChart3 },
  { href: "/cv", label: "简历", icon: FileText },
  { href: "/config", label: "配置", icon: Settings },
];

export function isActivePath(href: string, pathname: string): boolean {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}
