import { ProfileSettings } from "@/components/settings/profile-settings";

export default function SettingsPage() {
    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
                <p className="text-muted-foreground">
                    Manage your account settings and preferences.
                </p>
            </div>
            <div className="grid gap-6">
                <ProfileSettings />
            </div>
        </div>
    );
}

