"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Map as MapIcon, 
  PlusCircle, 
  MessageSquare, 
  ClipboardList
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { UserRole } from '../auth/auth-container';

interface BottomNavProps {
  role: UserRole;
}

export function BottomNav({ role }: BottomNavProps) {
  const pathname = usePathname();

  const items = [
    { label: 'Home', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Map', href: '/dashboard/map', icon: MapIcon },
    { 
      label: role === 'collector' ? 'Collector' : 'Report', 
      href: role === 'collector' ? '/dashboard/collector' : '/dashboard/report', 
      icon: role === 'collector' ? ClipboardList : PlusCircle,
      primary: true
    },
    { label: 'Chat', href: '/dashboard/complaint', icon: MessageSquare },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 p-4 bg-transparent z-50 pointer-events-none">
      <div className="max-w-md mx-auto flex items-center justify-around p-3 bg-card/80 backdrop-blur-xl rounded-3xl border border-primary/20 shadow-2xl pointer-events-auto">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center transition-all duration-300",
              item.primary ? "relative -top-4" : "p-2",
              pathname === item.href 
                ? "text-primary" 
                : "text-muted-foreground"
            )}
          >
            {item.primary ? (
              <div className={cn(
                "p-4 rounded-2xl bg-primary text-white shadow-lg shadow-primary/40 transition-transform active:scale-95",
                pathname === item.href && "neon-border"
              )}>
                <item.icon className="w-6 h-6" />
              </div>
            ) : (
              <item.icon className="w-6 h-6" />
            )}
            <span className={cn("text-[10px] mt-1 font-medium", item.primary && "invisible")}>{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
