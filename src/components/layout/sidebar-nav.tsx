
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Map as MapIcon,
  FileEdit,
  MessageSquare,
  BarChart3,
  ClipboardList,
  LogOut,
  Settings,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { UserRole } from '../auth/auth-container';
import { useState, useEffect } from 'react';
import { getUnrepliedComplaintsCount } from '@/app/actions/getComplaints';

interface SidebarNavProps {
  role: UserRole;
}

export function SidebarNav({ role }: SidebarNavProps) {
  const pathname = usePathname();
  const [unrepliedCount, setUnrepliedCount] = useState(0);

  useEffect(() => {
    if (role === 'collector') {
      const fetchCount = async () => {
        const res = await getUnrepliedComplaintsCount();
        if (res.success) setUnrepliedCount(res.count);
      };

      fetchCount();
      // refresh count every 30 seconds
      const interval = setInterval(fetchCount, 30000);
      return () => clearInterval(interval);
    }
  }, [role]);

  // Check for unreplied complaints
  const hasAlerts = unrepliedCount > 0;

  const commonItems = [
    { label: 'Home', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Campus Map', href: '/dashboard/map', icon: MapIcon },
  ];

  const reportingItems = [
    { label: 'Report Bin', href: '/dashboard/report', icon: FileEdit },
    { label: 'Lodge Complaint', href: '/dashboard/complaint', icon: MessageSquare },
  ];

  const collectorItems = [
    { label: 'Complaints', href: '/dashboard/alerts', icon: AlertCircle, alert: hasAlerts },
    { label: 'Collector Hub', href: '/dashboard/collector', icon: ClipboardList },
    { label: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
  ];

  const menuItems = [
    ...commonItems,
    ...(role === 'collector' ? collectorItems : reportingItems),
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 border-r bg-card/50 backdrop-blur-xl h-screen fixed left-0 top-0 z-50">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 rounded-xl bg-[#008080] text-white shadow-lg shadow-primary/20">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
            </svg>
          </div>
          <span className="font-headline font-bold text-lg">Waste Watch</span>
        </div>

        <nav className="space-y-2">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-300",
                pathname === item.href
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/30"
                  : "hover:bg-primary/10 text-muted-foreground hover:text-primary"
              )}
            >
              <div className="flex items-center gap-3">
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </div>
              {item.alert && (
                <div className="w-2 h-2 rounded-full bg-red-500 pulse-red" />
              )}
            </Link>
          ))}
        </nav>
      </div>

      <div className="mt-auto p-6 space-y-2">
        <Link href="/dashboard/settings" className="flex items-center gap-3 px-4 py-3 rounded-xl text-muted-foreground hover:bg-secondary w-full transition-colors">
          <Settings className="w-5 h-5" />
          <span className="font-medium">Settings</span>
        </Link>
        <button
          onClick={() => {
            localStorage.removeItem('user_role');
            window.location.href = '/';
          }}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-destructive hover:bg-destructive/10 w-full transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </aside>
  );
}
