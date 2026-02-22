
"use client";

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { UserRole } from './auth-container';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Check, X } from 'lucide-react';

import { API_URL } from "@/lib/config";


// --- Unified schema that covers ALL possible fields ---
const fullSchema = z.object({
  name: z.string().optional(),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().optional(),
  rollNumber: z.string().optional(),
  faculty: z.string().optional(),
  staffId: z.string().optional(),
});

type FormValues = z.infer<typeof fullSchema>;

// --- Validation schemas per mode/role (used for resolver) ---
const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

const signUpBase = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string()
});

const studentSchema = signUpBase.extend({
  rollNumber: z.string().min(3, "Valid roll number required"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const teacherSchema = signUpBase.extend({
  faculty: z.string().min(2, "Faculty name required"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const collectorSchema = signUpBase.extend({
  staffId: z.string().min(3, "Staff ID required"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// ========== Password Strength Rules ==========
interface PasswordRule {
  label: string;
  test: (pw: string) => boolean;
}

const passwordRules: PasswordRule[] = [
  { label: "Minimum 8 characters", test: (pw) => pw.length >= 8 },
  { label: "At least one uppercase letter", test: (pw) => /[A-Z]/.test(pw) },
  { label: "At least one number", test: (pw) => /\d/.test(pw) },
  { label: "At least one special character", test: (pw) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(pw) },
];

interface AuthFormProps {
  role: UserRole;
  onSuccess: (userData?: { email: string }) => void;
  mode: 'login' | 'signup';
}

export function AuthForm({ role, onSuccess, mode }: AuthFormProps) {
  const isLogin = mode === 'login';
  const router = useRouter();

  const schema = isLogin
    ? loginSchema
    : (role === 'student' ? studentSchema : role === 'teacher' ? teacherSchema : collectorSchema);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema as any),
    defaultValues: {
      email: '',
      password: '',
      name: '',
      confirmPassword: '',
      rollNumber: '',
      faculty: '',
      staffId: '',
    },
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // ========== LIVE PASSWORD CHECKER STATE ==========
  const watchedPassword = form.watch("password") || "";

  const onSubmit = async (values: FormValues) => {
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      if (isLogin) {
        // --- LOGIN via PHP API ---
        const res = await fetch(`${API_URL}/login.php`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            email: values.email,
            password: values.password,
            role: role,
          }),
        });

        const response = await res.json();

        if (response.success && response.user) {
          setSuccessMessage(`Welcome back, ${response.user.name}!`);
          localStorage.setItem('user_id', response.user.id);
          localStorage.setItem('user_email', response.user.email);
          localStorage.setItem('user_role', response.user.role);
          localStorage.setItem('user_name', response.user.name);
          onSuccess({ email: response.user.email });
          setTimeout(() => window.location.replace("/dashboard"), 1000);
        } else {
          setErrorMessage(response.error);
        }
      } else {
        // --- REGISTER via PHP API ---
        let identifier = "";
        if (role === 'student') identifier = values.rollNumber || "";
        else if (role === 'teacher') identifier = values.faculty || "";
        else if (role === 'collector') identifier = values.staffId || "";

        const res = await fetch(`${API_URL}/register.php`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            name: values.name,
            email: values.email,
            password: values.password,
            role: role,
            identifier: identifier,
          }),
        });

        const response = await res.json();

        if (response.success && response.user) {
          setSuccessMessage("Account created successfully!");
          localStorage.setItem('user_id', response.user.id);
          localStorage.setItem('user_email', response.user.email);
          localStorage.setItem('user_role', response.user.role);
          localStorage.setItem('user_name', response.user.name);
          onSuccess({ email: response.user.email });
        } else {
          setErrorMessage(response.error);
        }
      }
    } catch (error) {
      setErrorMessage("Could not connect to the server. Make sure XAMPP Apache is running.");
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {!isLogin && (
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl>
                  <Input placeholder="John Doe" {...field} className="bg-background/50" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {!isLogin && role === 'student' && (
          <FormField
            control={form.control}
            name="rollNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Roll Number</FormLabel>
                <FormControl>
                  <Input placeholder="TNT-..." {...field} className="bg-background/50" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {!isLogin && role === 'teacher' && (
          <FormField
            control={form.control}
            name="faculty"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Faculty</FormLabel>
                <FormControl>
                  <Input placeholder="Computer Science" {...field} className="bg-background/50" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {!isLogin && role === 'collector' && (
          <FormField
            control={form.control}
            name="staffId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Staff ID</FormLabel>
                <FormControl>
                  <Input placeholder="STAFF-999" {...field} className="bg-background/50" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email Address</FormLabel>
              <FormControl>
                <Input type="email" placeholder="john@uit.edu.mm" {...field} className="bg-background/50" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className={isLogin ? "space-y-4" : "grid grid-cols-2 gap-4"}>
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="••••••••" {...field} className="bg-background/50" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {!isLogin && (
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} className="bg-background/50" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>

        {/* ========== LIVE PASSWORD CHECKLIST (Signup only) ========== */}
        {!isLogin && watchedPassword.length > 0 && (
          <div className="rounded-lg border border-border/50 bg-background/30 p-3 space-y-1.5">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">
              Password Requirements
            </p>
            {passwordRules.map((rule, i) => {
              const passed = rule.test(watchedPassword);
              return (
                <div key={i} className="flex items-center gap-2 text-xs">
                  {passed ? (
                    <Check className="w-3.5 h-3.5 text-green-500" />
                  ) : (
                    <X className="w-3.5 h-3.5 text-red-400" />
                  )}
                  <span className={passed ? "text-green-500" : "text-muted-foreground"}>
                    {rule.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* ========== ERROR ALERT (red highlight) ========== */}
        {errorMessage && (
          <div className="flex items-start gap-3 rounded-lg border border-red-500/50 bg-red-500/10 p-3 animate-in fade-in slide-in-from-top-2 duration-300">
            <X className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-red-500">Access Denied</p>
              <p className="text-xs text-red-400 mt-0.5">{errorMessage}</p>
            </div>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              className="text-red-400 hover:text-red-300 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ========== SUCCESS ALERT (green highlight) ========== */}
        {successMessage && (
          <div className="flex items-start gap-3 rounded-lg border border-green-500/50 bg-green-500/10 p-3 animate-in fade-in slide-in-from-top-2 duration-300">
            <Check className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-green-500">Success</p>
              <p className="text-xs text-green-400 mt-0.5">{successMessage}</p>
            </div>
          </div>
        )}

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full font-headline bg-primary hover:bg-primary/90"
        >
          {isLoading ? (
            "Processing..."
          ) : (
            isLogin ? 'Sign In' : 'Create Account'
          )}
        </Button>
      </form>
    </Form>
  );
}
