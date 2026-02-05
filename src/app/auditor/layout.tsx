"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AuditorSidebar } from "@/components/layout/auditor-sidebar";
import { getSession, isAuditor } from "@/lib/auth/session";

export default function AuditorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [auditorName, setAuditorName] = useState<string | null>(null);

  useEffect(() => {
    const session = getSession();
    if (!session || !isAuditor()) {
      router.push("/");
      return;
    }
    setIsAuthorized(true);
    setAuditorName(session.auditorName || null);
  }, [router]);

  if (!isAuthorized) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-muted-foreground">Checking authorization...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      <AuditorSidebar />
      <main className="flex-1 overflow-auto bg-background">
        {/* Auditor identity banner - warm Crowe styling */}
        {auditorName && (
          <div className="bg-crowe-amber/10 dark:bg-crowe-amber/15 border-b border-crowe-amber/20 px-6 py-2">
            <div className="flex items-center gap-2 text-sm text-tint-900 dark:text-crowe-amber">
              <span className="font-medium">Logged in as:</span>
              <span>{auditorName}</span>
            </div>
          </div>
        )}
        {children}
      </main>
    </div>
  );
}
