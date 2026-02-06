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
      <div className="flex h-screen items-center justify-center bg-gray-100 dark:bg-crowe-indigo-dark">
        <div className="text-gray-500 dark:text-white/80">Checking authorization...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-crowe-indigo-dark">
      <AuditorSidebar />
      <main className="flex-1 overflow-auto">
        {/* Auditor identity banner - liquid glass styling */}
        {auditorName && (
          <div className="bg-gray-50 dark:bg-white/5 backdrop-blur-md border-b border-gray-200 dark:border-white/10 px-6 py-2">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-white/80">
              <span className="font-medium text-crowe-amber-dark dark:text-crowe-amber">Logged in as:</span>
              <span>{auditorName}</span>
            </div>
          </div>
        )}
        {children}
      </main>
    </div>
  );
}
