"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, FileSpreadsheet, LogOut } from "lucide-react";
import { clearSession } from "@/lib/auth/session";

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
    <div className="flex h-full w-64 flex-col bg-white dark:bg-crowe-indigo-dark border-r">
      {/* Header */}
      <div className="flex h-16 items-center border-b px-6">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-crowe-indigo-dark text-white font-bold">
            A
          </div>
          <span className="font-semibold">Auditor Portal</span>
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
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-crowe-amber/15 text-crowe-indigo-dark dark:bg-crowe-amber/20 dark:text-crowe-amber"
                  : "text-tint-700 hover:bg-crowe-indigo/5 dark:text-tint-300 dark:hover:bg-crowe-indigo-bright/20"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t p-4">
        <Button
          variant="ghost"
          className="w-full justify-start text-slate-600 hover:text-slate-900 dark:text-slate-400"
          onClick={handleSwitchRole}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Switch Role
        </Button>
      </div>
    </div>
  );
}
