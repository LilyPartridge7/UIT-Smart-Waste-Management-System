"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Check, X } from "lucide-react";

import { API_URL } from "@/lib/config";


const passwordSchema = z.object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string()
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});

type PasswordFormValues = z.infer<typeof passwordSchema>;

export function ProfileSettings() {
    const [userName, setUserName] = useState<string>("");
    const [userEmail, setUserEmail] = useState<string>("");
    const [userId, setUserId] = useState<string>("");

    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    useEffect(() => {
        setUserName(localStorage.getItem("user_name") || "Guest");
        setUserEmail(localStorage.getItem("user_email") || "No Email");
        setUserId(localStorage.getItem("user_id") || "");
    }, []);

    const form = useForm<PasswordFormValues>({
        resolver: zodResolver(passwordSchema),
        defaultValues: {
            currentPassword: "",
            newPassword: "",
            confirmPassword: "",
        },
    });

    const onSubmit = async (values: PasswordFormValues) => {
        setIsLoading(true);
        setErrorMessage(null);
        setSuccessMessage(null);

        // Provide a fallback response if testing without auth
        if (!userId) {
            setErrorMessage("User ID not found. Please log in again to change your password.");
            setIsLoading(false);
            return;
        }

        try {
            const res = await fetch(`${API_URL}/change_password.php`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    user_id: userId,
                    current_password: values.currentPassword,
                    new_password: values.newPassword,
                }),
            });

            const response = await res.json();

            if (response.success) {
                setSuccessMessage("Password changed successfully!");
                form.reset();
            } else {
                setErrorMessage(response.error || "Failed to change password.");
            }
        } catch (error) {
            setErrorMessage("Could not connect to the server. Ensure the backend is running.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-8 max-w-2xl">
            {/* Profile Info (Read-Only) */}
            <div className="space-y-4 rounded-xl border bg-card p-6 shadow-sm">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                    🧑‍🎓 Profile Information
                </h2>
                <div className="grid gap-4 md:grid-cols-2 mt-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium leading-none">Name</label>
                        <Input value={userName} readOnly className="bg-muted cursor-not-allowed text-muted-foreground" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium leading-none">Email Address</label>
                        <Input value={userEmail} readOnly className="bg-muted cursor-not-allowed text-muted-foreground" />
                    </div>
                </div>
                <p className="text-xs text-muted-foreground mt-4">
                    * Your name and email address are fixed and cannot be changed from this page.
                </p>
            </div>

            {/* Change Password Form */}
            <div className="space-y-4 rounded-xl border bg-card p-6 shadow-sm">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                    🔒 Change Password
                </h2>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 mt-4">
                        <FormField
                            control={form.control}
                            name="currentPassword"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Current Password</FormLabel>
                                    <FormControl>
                                        <Input type="password" placeholder="Enter your current password" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid gap-4 md:grid-cols-2">
                            <FormField
                                control={form.control}
                                name="newPassword"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>New Password</FormLabel>
                                        <FormControl>
                                            <Input type="password" placeholder="Enter new password" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="confirmPassword"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Confirm New Password</FormLabel>
                                        <FormControl>
                                            <Input type="password" placeholder="Confirm new password" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {errorMessage && (
                            <div className="flex items-start gap-3 rounded-lg border border-red-500/50 bg-red-500/10 p-3 pt-3 animate-in fade-in slide-in-from-top-2 duration-300">
                                <X className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
                                <div className="flex-1">
                                    <p className="text-sm font-semibold text-red-500">Error</p>
                                    <p className="text-xs text-red-400 mt-0.5">{errorMessage}</p>
                                </div>
                            </div>
                        )}

                        {successMessage && (
                            <div className="flex items-start gap-3 rounded-lg border border-green-500/50 bg-green-500/10 p-3 pt-3 animate-in fade-in slide-in-from-top-2 duration-300">
                                <Check className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                                <div className="flex-1">
                                    <p className="text-sm font-semibold text-green-500">Success</p>
                                    <p className="text-xs text-green-400 mt-0.5">{successMessage}</p>
                                </div>
                            </div>
                        )}

                        <Button type="submit" disabled={isLoading} className="mt-6 w-full md:w-auto px-8 font-semibold">
                            {isLoading ? "Updating..." : "Update Password"}
                        </Button>
                    </form>
                </Form>
            </div>
        </div>
    );
}
