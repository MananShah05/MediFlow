"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Calendar,
  FileText,
  CreditCard,
  Shield,
  Settings,
  Users,
  Stethoscope,
  Pill,
  FlaskConical,
  BedDouble,
  ListTodo,
  ArrowRightLeft,
  UserCog,
  BarChart3,
  ScrollText,
  Building2,
  Activity,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  LogOut,
  type LucideIcon,
} from "lucide-react";
import { LogoIcon } from "./logo";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/lib/auth";
import type { UserRole, NavItem } from "@/lib/constants";
import {
  NAV_ITEMS,
  ROLE_DISPLAY_NAMES,
  ROLE_ACCENT_COLORS,
  APP_NAME,
} from "@/lib/constants";

/** Map icon name strings to Lucide components */
const ICON_MAP: Record<string, LucideIcon> = {
  LayoutDashboard,
  Calendar,
  FileText,
  CreditCard,
  Shield,
  Settings,
  Users,
  Stethoscope,
  Pill,
  FlaskConical,
  BedDouble,
  ListTodo,
  ArrowRightLeft,
  UserCog,
  BarChart3,
  ScrollText,
  Building2,
  Activity,
  AlertTriangle,
};

interface SidebarProps {
  role: UserRole;
}

export function Sidebar({ role }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navItems = NAV_ITEMS[role];
  const accentColor = ROLE_ACCENT_COLORS[role];
  const roleName = ROLE_DISPLAY_NAMES[role];

  return (
    <aside
      className={cn(
        "flex flex-col h-screen bg-bg-elevated border-r border-border",
        "transition-[width] duration-modal ease-ease-out-custom",
        collapsed ? "w-sidebar-collapsed" : "w-sidebar"
      )}
    >
      {/* ── Logo + Collapse Toggle ── */}
      <div className="flex items-center justify-between px-4 h-14 border-b border-border-subtle shrink-0">
        {!collapsed && (
          <Link href="/" className="flex items-center gap-2">
            <LogoIcon className="w-7 h-7" />
            <span className="text-base font-semibold text-text-primary">
              {APP_NAME}
            </span>
          </Link>
        )}
        {collapsed && (
          <div className="flex items-center justify-center mx-auto">
            <LogoIcon className="w-7 h-7" />
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            "p-1 rounded-md text-text-tertiary hover:text-text-secondary hover:bg-bg-subtle",
            "transition-colors duration-fast",
            collapsed && "mx-auto mt-2"
          )}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* ── Role Label ── */}
      {!collapsed && (
        <div className="px-4 py-3 border-b border-border-subtle">
          <span
            className="text-xs font-semibold uppercase tracking-[0.05em]"
            style={{ color: accentColor }}
          >
            {roleName} Portal
          </span>
        </div>
      )}

      {/* ── Navigation ── */}
      <nav className="flex-1 overflow-y-auto py-2 px-2" aria-label="Main navigation">
        <ul className="flex flex-col gap-[2px]">
          {navItems.map((item: NavItem) => {
            const Icon = ICON_MAP[item.icon];
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium",
                    "transition-colors duration-fast",
                    isActive
                      ? "bg-bg-subtle text-text-primary"
                      : "text-text-secondary hover:text-text-primary hover:bg-bg-subtle/50",
                    collapsed && "justify-center px-2"
                  )}
                  aria-current={isActive ? "page" : undefined}
                  title={collapsed ? item.label : undefined}
                >
                  {Icon && (
                    <Icon
                      className={cn(
                        "w-[18px] h-[18px] shrink-0",
                        isActive && "text-clinical"
                      )}
                    />
                  )}
                  {!collapsed && <span>{item.label}</span>}
                  {isActive && (
                    <div
                      className="absolute left-0 w-[3px] h-6 rounded-r-full"
                      style={{ backgroundColor: accentColor }}
                    />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* ── User Card + Logout ── */}
      <div className="border-t border-border-subtle p-3 shrink-0">
        {user && !collapsed && (
          <div className="flex items-center gap-3 px-2 py-2">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-text-inverse shrink-0"
              style={{ backgroundColor: accentColor }}
            >
              {user.firstName?.[0]}
              {user.lastName?.[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text-primary truncate">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-xs text-text-tertiary truncate">{user.email}</p>
            </div>
          </div>
        )}
        <button
          onClick={() => logout()}
          className={cn(
            "flex items-center gap-3 w-full px-3 py-2 rounded-md text-sm",
            "text-text-secondary hover:text-critical hover:bg-critical-muted",
            "transition-colors duration-fast",
            collapsed && "justify-center px-2"
          )}
          title={collapsed ? "Log out" : undefined}
        >
          <LogOut className="w-[18px] h-[18px] shrink-0" />
          {!collapsed && <span>Log out</span>}
        </button>
      </div>
    </aside>
  );
}
