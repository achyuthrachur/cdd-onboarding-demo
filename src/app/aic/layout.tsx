"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AicSidebar } from "@/components/layout/aic-sidebar";
import { ErrorBoundary } from "@/components/error-boundary";
import { getSession } from "@/lib/auth/session";
import { loadPortalData } from "@/lib/stage-data";

export default function AicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const session = getSession();
    if (!session || session.role !== 'aic') {
      router.push('/');
    } else {
      setIsAuthorized(true);
      loadPortalData('aic');
    }
  }, [router]);

  if (!isAuthorized) {
    return (
      <div className="flex h-screen items-center justify-center bg-soft-gradient">
        <p className="text-tint-500 dark:text-tint-300">Checking authorization...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-soft-gradient bg-noise">
      <AicSidebar />
      <main className="flex-1 overflow-auto">
        <div className="bg-white/60 dark:bg-white/5 backdrop-blur-md border-b border-tint-200/50 dark:border-white/10 px-6 py-2">
          <div className="flex items-center gap-2 text-sm text-tint-700 dark:text-tint-300">
            <span className="font-medium text-crowe-amber-dark dark:text-crowe-amber">Auditor in Charge</span>
            <span className="text-tint-300 dark:text-white/30">|</span>
            <span>CDD Onboarding Demo</span>
          </div>
        </div>
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </main>
    </div>
  );
}
