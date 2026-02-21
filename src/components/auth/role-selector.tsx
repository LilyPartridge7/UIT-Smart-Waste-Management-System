"use client";

import { UserRole } from './auth-container';
import { GraduationCap, School, Truck } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RoleSelectorProps {
  onSelect: (role: UserRole) => void;
}

export function RoleSelector({ onSelect }: RoleSelectorProps) {
  const roles = [
    {
      id: 'student' as UserRole,
      title: 'Student',
      description: 'Report full bins and find disposal spots near you.',
      icon: GraduationCap,
      color: 'text-primary',
    },
    {
      id: 'teacher' as UserRole,
      title: 'Teacher',
      description: 'Help maintain campus cleanliness and report issues.',
      icon: School,
      color: 'text-accent',
    },
    {
      id: 'collector' as UserRole,
      title: 'Collector',
      description: 'Manage routes and update bin status in real-time.',
      icon: Truck,
      color: 'text-primary',
    },
  ];

  return (
    <div className="grid gap-4">
      {roles.map((role) => (
        <button
          key={role.id}
          onClick={() => onSelect(role.id)}
          className={cn(
            "group flex items-start gap-4 p-4 text-left transition-all border rounded-xl hover:bg-primary/5 hover:border-primary/50",
            "bg-card/50 backdrop-blur-sm border-border"
          )}
        >
          <div className={cn("p-2 rounded-lg bg-secondary group-hover:bg-primary/10 transition-colors", role.color)}>
            <role.icon className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-semibold font-headline">{role.title}</h3>
            <p className="text-sm text-muted-foreground">{role.description}</p>
          </div>
        </button>
      ))}
    </div>
  );
}
