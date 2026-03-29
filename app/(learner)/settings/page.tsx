"use client";

import { useAuth } from "@/contexts/auth-context";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function LearnerSettingsPage() {
  const { user } = useAuth();
  
  return (
    <div className="flex flex-col gap-8 max-w-3xl mx-auto w-full pt-4">
      <div className="flex flex-col gap-2 border-b pb-6">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <span className="material-symbols-outlined text-primary text-[32px]">settings</span>
          Account Settings
        </h1>
        <p className="text-muted-foreground">
          Update your profile, change your target bands, and manage notifications.
        </p>
      </div>

      <div className="grid gap-6">
        <Card className="p-6 border shadow-sm">
          <h2 className="text-lg font-bold mb-4">Personal Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Full Name</label>
              <p className="mt-1 font-medium">{user?.fullName || "Not set"}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Email Address</label>
              <p className="mt-1 font-medium">{user?.email || "Not set"}</p>
            </div>
          </div>
          <Button variant="outline" className="mt-6">Edit Profile</Button>
        </Card>

        <Card className="p-6 border shadow-sm">
          <h2 className="text-lg font-bold mb-4">Target Band Scores</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Your target scores are used by the AI coach to dynamically adjust recommendations.
          </p>
          <Button variant="secondary">Adjust Targets</Button>
        </Card>
        
        <Card className="p-6 border shadow-sm border-red-100 dark:border-red-900/30">
          <h2 className="text-lg font-bold text-red-600 mb-2">Danger Zone</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Once you delete your account, there is no going back. Please be certain.
          </p>
          <Button variant="destructive">Delete My Account</Button>
        </Card>
      </div>
    </div>
  );
}
