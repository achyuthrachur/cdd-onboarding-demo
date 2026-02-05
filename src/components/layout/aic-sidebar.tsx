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
    <div className="flex h-full w-64 flex-col bg-white/5 backdrop-blur-xl border-r border-white/10">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 px-6 border-b border-white/10">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-crowe-amber text-crowe-indigo-dark shadow-[0_4px_16px_rgba(245,168,0,0.3)]">
          <Crown className="h-4 w-4" />
        </div>
        <div>
          <span className="font-semibold text-lg text-white">CDD Demo</span>
          <span className="ml-2 text-xs text-crowe-amber font-medium">AIC</span>
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
                    ? "bg-white/15 text-white border border-white/20 shadow-[0_4px_12px_rgba(0,0,0,0.2)]"
                    : "text-white/70 hover:bg-white/10 hover:text-white"
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
      <div className="border-t border-white/10 px-3 py-4 space-y-2">
        <Button
          variant="ghost"
          className="w-full justify-start text-white/60 hover:text-white hover:bg-white/10"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4 mr-3" />
          Switch Role
        </Button>
        <p className="text-xs text-white/40 px-3">
          CDD Demo v1.0 | AIC Portal
        </p>
      </div>
    </div>
  );
}
