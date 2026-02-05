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
        {/* Auditor identity banner */}
        {auditorName && (
          <div className="bg-crowe-amber/10 dark:bg-crowe-amber/20 border-b border-crowe-amber/30 dark:border-crowe-amber/40 px-6 py-2">
            <div className="flex items-center gap-2 text-sm text-crowe-indigo-dark dark:text-crowe-amber">
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
