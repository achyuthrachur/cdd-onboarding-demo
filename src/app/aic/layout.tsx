"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AicSidebar } from "@/components/layout/aic-sidebar";
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
      <div className="flex h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Checking authorization...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      <AicSidebar />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
