"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AicSidebar } from "@/components/layout/aic-sidebar";
import { ErrorBoundary } from "@/components/error-boundary";
import { getSession } from "@/lib/auth/session";

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
    }
  }, [router]);

  if (!isAuthorized) {
    return (
      <div className="flex h-screen items-center justify-center bg-soft-gradient">
        <p className="text-gray-500 dark:text-gray-300">Checking authorization...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-soft-gradient">
      <AicSidebar />
      <main className="flex-1 overflow-auto bg-soft-gradient">
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </main>
    </div>
  );
}
