"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AvatarUpload } from "@/components/ui/avatar-upload";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { authApi } from "@/lib/api/auth";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

const AUTH_API = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api`;

export default function UserProfilePage() {
    const router = useRouter();
    const { user, setUser, isLoggedIn, loading } = useAuth();
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        fullName: "",
        avatarUrl: "",
    });

    useEffect(() => {
        if (!loading && !isLoggedIn) {
            router.push("/login");
        }
    }, [loading, isLoggedIn, router]);

    useEffect(() => {
        if (user) {
            setFormData({
                fullName: user.fullName || "",
                avatarUrl: user.avatarUrl || "",
            });
        }
    }, [user]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setSaving(true);

        try {
            const res = await fetch(`${AUTH_API}/auth/profile`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${authApi.getStoredUser() ? (document.cookie.split('; ').find(row => row.startsWith('accessToken='))?.split('=')[1]) : ''}`,
                },
                body: JSON.stringify(formData),
            });

            if (!res.ok) throw new Error("Failed to update profile");

            const updatedUser = (await res.json()).data;
            const newUser = { ...updatedUser };

            setUser(newUser);
            authApi.updateStoredUser(newUser);
            toast.success("Profile saved successfully");
        } catch (error) {
            console.error(error);
            toast.error("Failed to update profile");
        } finally {
            setSaving(false);
        }
    };

    const isChanged = user && (user.fullName !== formData.fullName || user.avatarUrl !== formData.avatarUrl);

    if (loading || !user) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-10 px-4 md:px-6 max-w-3xl">
            <div className="flex items-center gap-4 mb-8">
                <Button variant="ghost" size="icon" asChild className="rounded-full">
                    <Link href="/">
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                </Button>
                <h1 className="text-3xl font-bold tracking-tight">Account Settings</h1>
            </div>

            <Card className="border-muted shadow-sm">
                <CardHeader>
                    <CardTitle>Profile Details</CardTitle>
                    <CardDescription>
                        Update your personal information and profile photo.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSave} className="space-y-8">
                        <div className="flex flex-col md:flex-row gap-8 items-start">
                            {/* Avatar Section */}
                            <div className="flex flex-col items-center gap-2 pt-2 md:pr-8 md:border-r border-muted min-w-[200px]">
                                <AvatarUpload
                                    size="xl"
                                    currentAvatarUrl={formData.avatarUrl}
                                    fullName={formData.fullName || user.email}
                                    onUpload={(url) => setFormData(prev => ({ ...prev, avatarUrl: url }))}
                                />
                                <p className="text-xs text-muted-foreground mt-2 text-center">
                                    Click the camera icon to<br />upload a new photo.
                                </p>
                            </div>

                            {/* Info Section */}
                            <div className="flex-1 space-y-4 w-full">
                                <div className="space-y-2">
                                    <Label htmlFor="email" className="text-muted-foreground">Email Address</Label>
                                    <Input
                                        id="email"
                                        value={user.email}
                                        disabled
                                        className="bg-muted/50 cursor-not-allowed"
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Your email address cannot be changed.
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="fullName">Full Name</Label>
                                    <Input
                                        id="fullName"
                                        value={formData.fullName}
                                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                        placeholder="Enter your full name"
                                        className="max-w-md"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="role" className="text-muted-foreground">Account Type</Label>
                                    <div className="capitalize inline-block px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-semibold">
                                        {user.role}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end pt-6 border-t border-muted">
                            <Button type="submit" disabled={saving || !isChanged}>
                                {saving ? "Saving..." : "Save changes"}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            {/* We could add generic sections here for changing passwords, but since we support Google Auth, we'll keep it simple for now */}
        </div>
    );
}
