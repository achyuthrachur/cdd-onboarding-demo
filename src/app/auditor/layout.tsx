"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AuditorSidebar } from "@/components/layout/auditor-sidebar";
import { ErrorBoundary } from "@/components/error-boundary";
import { getSession, isAuditor } from "@/lib/auth/session";
import { loadPortalData } from "@/lib/stage-data";

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
    loadPortalData('auditor');
  }, [router]);

  if (!isAuthorized) {
    return (
      <div className="flex h-screen items-center justify-center bg-soft-gradient">
        <div className="text-tint-500 dark:text-tint-300">Checking authorization...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-soft-gradient bg-noise">
      <AuditorSidebar />
      <main className="flex-1 overflow-auto">
        {/* Auditor identity banner - liquid glass styling */}
        {auditorName && (
          <div className="bg-white/60 dark:bg-white/5 backdrop-blur-md border-b border-tint-200/50 dark:border-white/10 px-6 py-2">
            <div className="flex items-center gap-2 text-sm text-tint-700 dark:text-tint-300">
              <span className="font-medium text-crowe-amber-dark dark:text-crowe-amber">Logged in as:</span>
              <span>{auditorName}</span>
            </div>
          </div>
        )}
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </main>
    </div>
  );
}
