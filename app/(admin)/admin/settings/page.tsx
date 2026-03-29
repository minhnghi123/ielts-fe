"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function AdminSettingsPage() {
  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">System Settings</h1>
        <p className="text-muted-foreground text-sm">
          Manage core platform configurations, third-party integrations, and automated alerts.
        </p>
      </div>

      <div className="grid gap-6">
        <Card className="p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <span className="material-symbols-outlined text-orange-500">memory</span>
                AI Service Integration
              </h2>
              <p className="text-sm text-muted-foreground">Configure the API keys and endpoints for marking engines.</p>
            </div>
            <Button variant="outline">Configure</Button>
          </div>
        </Card>

        <Card className="p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <span className="material-symbols-outlined text-green-500">mark_email_read</span>
                Automated Mailer
              </h2>
              <p className="text-sm text-muted-foreground">Set up SMTP or SendGrid connection for student alerts.</p>
            </div>
            <Button variant="outline">Configure</Button>
          </div>
        </Card>

        <Card className="p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-500">analytics</span>
                Analytics Cron Jobs
              </h2>
              <p className="text-sm text-muted-foreground">Manage the frequency of background data aggregations.</p>
            </div>
            <Button variant="outline">Schedule</Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
