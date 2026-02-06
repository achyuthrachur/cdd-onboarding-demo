"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, FileSpreadsheet, LogOut } from "lucide-react";
import { clearSession } from "@/lib/auth/session";
import { ThemeToggle } from "@/components/theme-toggle";

const navigation = [
  {
    name: "Dashboard",
    href: "/auditor",
    icon: LayoutDashboard,
  },
  {
    name: "My Workbooks",
    href: "/auditor/workbooks",
    icon: FileSpreadsheet,
  },
];

export function AuditorSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleSwitchRole = () => {
    clearSession();
    router.push("/");
  };

  return (
    <div className="flex h-full w-64 flex-col bg-white/80 dark:bg-white/5 backdrop-blur-xl border-r border-gray-200/60 dark:border-white/10 shadow-[1px_0_8px_rgba(0,0,0,0.03)]">
      {/* Header */}
      <div className="flex h-16 items-center border-b border-gray-200/60 dark:border-white/10 px-6">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-crowe-cyan text-white font-bold shadow-[0_4px_16px_rgba(84,192,232,0.3)]">
            A
          </div>
          <span className="font-semibold text-gray-900 dark:text-white">Auditor Portal</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4">
        {navigation.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/auditor" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-gray-200 dark:bg-white/15 text-gray-900 dark:text-white border border-gray-300 dark:border-white/20 shadow-[0_4px_12px_rgba(0,0,0,0.1)] dark:shadow-[0_4px_12px_rgba(0,0,0,0.2)]"
                  : "text-gray-600 dark:text-white/80 hover:bg-gray-100 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Theme Toggle */}
      <div className="flex items-center justify-between px-4 py-2 border-t border-gray-200/60 dark:border-white/10">
        <span className="text-sm text-gray-500 dark:text-white/80">Theme</span>
        <ThemeToggle />
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200/60 dark:border-white/10 p-4">
        <Button
          variant="ghost"
          className="w-full justify-start text-gray-600 dark:text-white/80 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10"
          onClick={handleSwitchRole}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Switch Role
        </Button>
      </div>
    </div>
  );
}
