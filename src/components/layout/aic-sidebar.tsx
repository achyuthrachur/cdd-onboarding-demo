"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  FileStack,
  LogOut,
  Crown,
} from "lucide-react";
import { clearSession } from "@/lib/auth/session";

const navigation = [
  {
    name: "Dashboard",
    href: "/aic",
    icon: LayoutDashboard,
  },
  {
    name: "Audit Runs",
    href: "/aic/audit-runs",
    icon: FileStack,
  },
];

export function AicSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    clearSession();
    router.push("/");
  };

  return (
    <div className="flex h-full w-64 flex-col bg-white dark:bg-gradient-to-b dark:from-[#1e3a5f] dark:to-[#1a365d] border-r border-tint-200 dark:border-white/10">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 px-6 border-b border-tint-200 dark:border-white/10">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-crowe-amber text-crowe-indigo-dark shadow-amber-glow">
          <Crown className="h-4 w-4" />
        </div>
        <div>
          <span className="font-semibold text-lg text-tint-900 dark:text-white">CDD Demo</span>
          <span className="ml-2 text-xs text-crowe-amber-dark dark:text-crowe-amber font-medium">AIC</span>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        <div className="space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href ||
              (item.href !== "/aic" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-crowe-indigo-dark text-white shadow-crowe-sm"
                    : "text-tint-700 hover:bg-tint-50 dark:text-tint-300 dark:hover:bg-white/10"
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Logout / Switch Role */}
      <div className="border-t border-tint-200 dark:border-white/10 px-3 py-4 space-y-2">
        <Button
          variant="ghost"
          className="w-full justify-start text-tint-500 hover:text-tint-900 hover:bg-tint-50 dark:text-tint-300 dark:hover:text-white dark:hover:bg-white/10"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4 mr-3" />
          Switch Role
        </Button>
        <p className="text-xs text-tint-500 dark:text-tint-500 px-3">
          CDD Demo v1.0 | AIC Portal
        </p>
      </div>
    </div>
  );
}
