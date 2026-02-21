"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RoleSelector } from './role-selector';
import { AuthForm } from './auth-form';
import { useRouter } from 'next/navigation';

export type UserRole = 'student' | 'teacher' | 'collector' | null;

export function AuthContainer() {
  const [role, setRole] = useState<UserRole>(null);
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const router = useRouter();

  const handleRoleSelect = (selectedRole: UserRole) => {
    setRole(selectedRole);
  };

  // const handleSuccess = () => {
  //   if (role) {
  //     localStorage.setItem('user_role', role);
  //     router.push('/dashboard');
  //   }
  // };
  const handleSuccess = (userData?: { email: string }) => {
    if (role) { //; name?: string; photo?: string 
      localStorage.setItem('user_role', role);

      // Save Gmail details if they exist
      if (userData?.email) {
        localStorage.setItem('user_email', userData.email); // Save email here
      }

      router.push('/dashboard');
    }
  };




  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {!role ? (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-center font-headline text-foreground">Welcome to UIT Waste Watch</h2>
          <p className="text-center text-muted-foreground text-sm">Select your role to continue</p>
          <RoleSelector onSelect={handleRoleSelect} />
        </div>
      ) : (
        <Card className="border-primary/20 bg-card/50 backdrop-blur-xl">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="capitalize font-headline">
                {mode === 'login' ? 'Sign In' : 'Sign Up'} as {role}
              </CardTitle>
              <button
                onClick={() => setRole(null)}
                className="text-xs text-primary hover:underline"
              >
                Change Role
              </button>
            </div>
            <CardDescription>
              {mode === 'login'
                ? 'Welcome back! Please enter your credentials.'
                : 'Join the UIT waste management network today.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <AuthForm key={`${mode}-${role}`} role={role} onSuccess={handleSuccess} mode={mode} />
            <div className="text-center">
              <button
                onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                {mode === 'login'
                  ? "Don't have an account? Sign Up"
                  : "Already have an account? Sign In"}
              </button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
