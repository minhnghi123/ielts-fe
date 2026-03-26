"use client";

import {
    useState,
    useRef,
    useCallback,
    ChangeEvent,
    DragEvent,
} from "react";
import ReactCrop, {
    Crop,
    PixelCrop,
    centerCrop,
    makeAspectCrop,
} from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import {
    ImageIcon,
    Upload,
    X,
    CheckCircle,
    AlertCircle,
    Loader2,
    Crop as CropIcon,
} from "lucide-react";

interface ImageUploaderProps {
    value?: string;
    onChange: (url: string) => void;
    /** Optional label shown above the uploader */
    label?: string;
}

type UploadState = "idle" | "cropping" | "uploading" | "success" | "error";

function centerAspectCrop(
    mediaWidth: number,
    mediaHeight: number,
    aspect: number,
) {
    return centerCrop(
        makeAspectCrop({ unit: "%", width: 90 }, aspect, mediaWidth, mediaHeight),
        mediaWidth,
        mediaHeight,
    );
}

/** Convert a PixelCrop into a canvas-derived blob */
async function getCroppedBlob(
    image: HTMLImageElement,
    crop: PixelCrop,
): Promise<Blob> {
    const canvas = document.createElement("canvas");
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    canvas.width = crop.width * scaleX;
    canvas.height = crop.height * scaleY;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(
        image,
        crop.x * scaleX,
        crop.y * scaleY,
        crop.width * scaleX,
        crop.height * scaleY,
        0,
        0,
        canvas.width,
        canvas.height,
    );
    return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
            if (blob) resolve(blob);
            else reject(new Error("Failed to crop image"));
        }, "image/png");
    });
}

export default function ImageUploader({ value, onChange, label }: ImageUploaderProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const imgRef = useRef<HTMLImageElement>(null);

    const [uploadState, setUploadState] = useState<UploadState>(value ? "success" : "idle");
    const [uploadedUrl, setUploadedUrl] = useState(value || "");
    const [errorMessage, setErrorMessage] = useState("");
    const [isDragging, setIsDragging] = useState(false);

    // Crop state
    const [srcImage, setSrcImage] = useState<string>("");
    const [crop, setCrop] = useState<Crop>();
    const [completedCrop, setCompletedCrop] = useState<PixelCrop>();

    const loadFile = (file: File) => {
        const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/bmp"];
        const ALLOWED_EXT = /\.(jpe?g|png|webp|gif|bmp)$/i;
        if (!ALLOWED_TYPES.includes(file.type) && !ALLOWED_EXT.test(file.name)) {
            setUploadState("error");
            setErrorMessage("Invalid file type. Please upload an image (JPEG, PNG, WebP, GIF).");
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            setUploadState("error");
            setErrorMessage("File too large. Maximum size is 10 MB.");
            return;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
            setSrcImage(e.target?.result as string);
            setUploadState("cropping");
        };
        reader.readAsDataURL(file);
    };

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) loadFile(file);
    };

    const handleDrop = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) loadFile(file);
    };

    const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
        const { width, height } = e.currentTarget;
        setCrop(centerAspectCrop(width, height, 16 / 9));
    }, []);

    const handleUpload = async () => {
        if (!completedCrop || !imgRef.current) return;
        setUploadState("uploading");
        setErrorMessage("");
        try {
            const blob = await getCroppedBlob(imgRef.current, completedCrop);
            const formData = new FormData();
            formData.append("file", blob, "image.png");
            const res = await fetch("/api/upload/image", {
                method: "POST",
                body: formData,
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || "Upload failed");
            }
            const data = await res.json();
            setUploadedUrl(data.url);
            setSrcImage("");
            setUploadState("success");
            onChange(data.url);
        } catch (err: unknown) {
            setUploadState("error");
            setErrorMessage(err instanceof Error ? err.message : "Upload failed. Please try again.");
        }
    };

    const handleRemove = () => {
        setUploadState("idle");
        setUploadedUrl("");
        setSrcImage("");
        setCrop(undefined);
        setCompletedCrop(undefined);
        onChange("");
        if (inputRef.current) inputRef.current.value = "";
    };

    // ── Success ──────────────────────────────────────────────────────────────
    if (uploadState === "success" && uploadedUrl) {
        return (
            <div className="rounded-xl border border-green-200 bg-green-50 p-3 space-y-2">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium text-green-800">Image uploaded</span>
                    </div>
                    <button type="button" onClick={handleRemove} className="p-1 hover:bg-green-100 rounded-md text-green-600 hover:text-red-500 transition-colors">
                        <X className="w-4 h-4" />
                    </button>
                </div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={uploadedUrl} alt="Uploaded" className="rounded-lg max-h-48 w-full object-contain bg-slate-100" />
            </div>
        );
    }

    // ── Error ────────────────────────────────────────────────────────────────
    if (uploadState === "error") {
        return (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 space-y-2">
                <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-red-700">{errorMessage}</p>
                </div>
                <button type="button" onClick={handleRemove} className="text-sm font-medium text-red-600 hover:underline">
                    Try again
                </button>
                <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            </div>
        );
    }

    // ── Uploading ────────────────────────────────────────────────────────────
    if (uploadState === "uploading") {
        return (
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 flex items-center gap-3">
                <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                <span className="text-sm font-medium text-blue-800">Uploading image…</span>
            </div>
        );
    }

    // ── Crop UI ──────────────────────────────────────────────────────────────
    if (uploadState === "cropping" && srcImage) {
        return (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <CropIcon className="w-4 h-4 text-slate-600" />
                        <span className="text-sm font-semibold text-slate-700">Adjust crop area</span>
                    </div>
                    <button type="button" onClick={handleRemove} className="p-1 hover:bg-slate-200 rounded-md text-slate-500 transition-colors">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <div className="max-h-72 overflow-hidden flex justify-center rounded-lg bg-slate-200">
                    <ReactCrop
                        crop={crop}
                        onChange={(_, pct) => setCrop(pct)}
                        onComplete={(c) => setCompletedCrop(c)}
                        aspect={undefined}
                    >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            ref={imgRef}
                            src={srcImage}
                            alt="Crop preview"
                            onLoad={onImageLoad}
                            className="max-h-72 object-contain"
                        />
                    </ReactCrop>
                </div>

                <p className="text-xs text-slate-500">
                    Drag handles to crop. The entire image will upload if you skip cropping.
                </p>

                <div className="flex gap-3">
                    <button
                        type="button"
                        onClick={handleUpload}
                        disabled={!completedCrop}
                        className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white text-sm font-semibold px-4 py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                        <Upload className="w-4 h-4" />
                        Upload Cropped Image
                    </button>
                    <button
                        type="button"
                        onClick={handleRemove}
                        className="px-4 py-2.5 text-sm font-medium border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors text-slate-600"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        );
    }

    // ── Idle / Drop zone ─────────────────────────────────────────────────────
    return (
        <div>
            {label && <p className="text-sm font-medium text-slate-700 mb-2">{label}</p>}
            <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
                className={`
                    cursor-pointer rounded-xl border-2 border-dashed transition-all
                    flex flex-col items-center justify-center gap-3 px-6 py-6
                    ${isDragging
                        ? "border-blue-500 bg-blue-50 scale-[1.01]"
                        : "border-slate-300 bg-slate-50 hover:border-blue-400 hover:bg-blue-50"
                    }
                `}
            >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isDragging ? "bg-blue-100" : "bg-slate-100"}`}>
                    {isDragging
                        ? <Upload className="w-5 h-5 text-blue-600" />
                        : <ImageIcon className="w-5 h-5 text-slate-400" />
                    }
                </div>
                <div className="text-center">
                    <p className="text-sm font-semibold text-slate-700">
                        {isDragging ? "Drop image here" : "Upload Image"}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                        Drag & drop or <span className="text-blue-600 font-medium">browse</span> — JPEG, PNG, WebP, GIF (max 10 MB)
                    </p>
                </div>
            </div>
            <input
                ref={inputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
            />
        </div>
    );
}
