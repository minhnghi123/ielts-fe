"use client";

import { useState, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Camera, Loader2 } from "lucide-react";

interface AvatarUploadProps {
    currentAvatarUrl?: string;
    fullName?: string;
    onUpload: (url: string) => void;
    size?: "sm" | "md" | "lg" | "xl";
}

export function AvatarUpload({
    currentAvatarUrl,
    fullName = "User",
    onUpload,
    size = "md",
}: AvatarUploadProps) {
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const sizeClasses = {
        sm: "h-8 w-8",
        md: "h-12 w-12",
        lg: "h-20 w-20",
        xl: "h-32 w-32",
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        try {
            setIsUploading(true);

            if (!event.target.files || event.target.files.length === 0) {
                throw new Error("You must select an image to upload.");
            }

            const file = event.target.files[0];
            const fileExt = file.name.split(".").pop();
            const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from("avatars")
                .upload(filePath, file);

            if (uploadError) {
                throw uploadError;
            }

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from("avatars")
                .getPublicUrl(filePath);

            onUpload(publicUrl);
        } catch (error: any) {
            toast.error(error.message || "Error uploading avatar!");
            console.error(error);
        } finally {
            setIsUploading(false);
            // Reset input so the same file can be selected again
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };

    return (
        <div className="flex flex-col items-center gap-4">
            <div className="relative group">
                <Avatar className={`${sizeClasses[size]} border-2 border-background shadow-sm transition-all group-hover:opacity-80`}>
                    <AvatarImage src={currentAvatarUrl} alt={fullName} />
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold text-lg">
                        {fullName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                </Avatar>

                {isUploading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/50 rounded-full">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                )}

                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="absolute bottom-0 right-0 rounded-full bg-primary p-1.5 text-primary-foreground shadow-sm hover:scale-105 transition-transform"
                >
                    <Camera className="h-4 w-4" />
                </button>
            </div>

            <input
                type="file"
                id="avatar"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleFileChange}
                disabled={isUploading}
                className="hidden"
            />
        </div>
    );
}
