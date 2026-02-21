

"use client";

import { SidebarNav } from '@/components/layout/sidebar-nav';
import { BottomNav } from '@/components/layout/bottom-nav';
import { useEffect, useState } from 'react';
import { UserRole } from '@/components/auth/auth-container';
import { useRouter } from 'next/navigation';

export default function DashboardLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const [role, setRole] = useState<UserRole>(null);
  // Create state to hold the Gmail
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const savedRole = localStorage.getItem('user_role') as UserRole;
    const savedEmail = localStorage.getItem('user_email');

    console.log("Storage check:", { savedRole, savedEmail }); // Check your F12 console!

    if (!savedRole) {
      router.push('/');
    } else {
      setRole(savedRole);
      // If savedEmail is null, we show "Guest" instead of "Loading..."
      setUserEmail(savedEmail || "Guest User");
    }
  }, [router]);

  if (!role) return null;

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <SidebarNav role={role} />

      <main className="flex-1 flex flex-col md:pl-64 pb-20 md:pb-0">
        <header className="h-16 border-b flex items-center justify-between px-6 bg-card/50 backdrop-blur-md sticky top-0 z-40">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-headline font-bold text-primary">UIT Waste Watch</h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end">
              {/* This now shows the Gmail address directly */}
              <span className="text-sm font-medium">{userEmail || "Loading..."}</span>
              <span className="text-xs text-muted-foreground capitalize">{role}</span>
            </div>
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold border border-primary/20">
              {userEmail ? userEmail.charAt(0).toUpperCase() : "U"}
            </div>
          </div>
        </header>

        <div className="flex-1 p-4 md:p-8">
          {children}
        </div>
      </main>

      <BottomNav role={role} />
    </div>
  );
}