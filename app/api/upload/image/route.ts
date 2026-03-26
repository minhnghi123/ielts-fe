import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File | null;

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/bmp"];
        const ALLOWED_EXT = /\.(jpe?g|png|webp|gif|bmp)$/i;
        if (!ALLOWED_TYPES.includes(file.type) && !ALLOWED_EXT.test(file.name)) {
            return NextResponse.json(
                { error: "Invalid file type. Please upload an image (JPEG, PNG, WebP, GIF)." },
                { status: 400 },
            );
        }

        const MAX_SIZE = 10 * 1024 * 1024; // 10 MB
        if (file.size > MAX_SIZE) {
            return NextResponse.json(
                { error: "File too large. Maximum size is 10 MB." },
                { status: 400 },
            );
        }

        // Dynamically import sharp so it only runs on the server
        const sharp = (await import("sharp")).default;

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Resize: max 1200px wide, convert to WebP, quality 85
        const processedBuffer = await sharp(buffer)
            .resize({ width: 1200, withoutEnlargement: true })
            .webp({ quality: 85 })
            .toBuffer();

        const { width, height } = await sharp(processedBuffer).metadata();

        // Upload to Cloudinary
        const result = await new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
            cloudinary.uploader.upload_stream(
                {
                    resource_type: "image",
                    folder: "ielts-images",
                    format: "webp",
                },
                (error, result) => {
                    if (error || !result) reject(error || new Error("Upload failed"));
                    else resolve(result as any);
                },
            ).end(processedBuffer);
        });

        return NextResponse.json({
            url: result.secure_url,
            publicId: result.public_id,
            width,
            height,
        });
    } catch (err: unknown) {
        console.error("[Image Upload Error]", err);
        return NextResponse.json(
            { error: err instanceof Error ? err.message : "Upload failed" },
            { status: 500 },
        );
    }
}
