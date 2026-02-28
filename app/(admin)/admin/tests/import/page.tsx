"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ParsePreview {
    skill: string;
    title: string;
    isMock: boolean;
    sections: { sectionOrder: number; audioFilename?: string; questions: any[] }[];
    writingTasks: { taskNumber: number; prompt: string; wordLimit: number }[];
    speakingParts: { partNumber: number; prompt: string }[];
    stats: { sections: number; questions: number; writingTasks: number; speakingParts: number };
    parsed?: ParsePreview;
}

const API_BASE = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api`;
const ADMIN_ID = "a1b2c3d4-0000-0000-0000-000000000001";

// ─── Skill badge colours ──────────────────────────────────────────────────────

const SKILL_COLORS: Record<string, string> = {
    reading: "bg-blue-100 text-blue-700",
    listening: "bg-purple-100 text-purple-700",
    writing: "bg-green-100 text-green-700",
    speaking: "bg-orange-100 text-orange-700",
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ImportTestPage() {
    const router = useRouter();
    const docxRef = useRef<HTMLInputElement>(null);
    const audioRef = useRef<HTMLInputElement>(null);

    const [docxFile, setDocxFile] = useState<File | null>(null);
    const [audioFiles, setAudioFiles] = useState<File[]>([]);
    const [dragging, setDragging] = useState(false);
    const [step, setStep] = useState<"upload" | "preview" | "done">("upload");
    const [preview, setPreview] = useState<ParsePreview | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [importedId, setImportedId] = useState<string | null>(null);

    // ── Drag & drop ──────────────────────────────────────────────────────────

    const onDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setDragging(false);
        const file = Array.from(e.dataTransfer.files).find((f) =>
            f.name.endsWith(".docx")
        );
        if (file) setDocxFile(file);
        else setError("Please drop a .docx file");
    }, []);

    // ── Parse preview ────────────────────────────────────────────────────────

    const handlePreview = async () => {
        if (!docxFile) return;
        setLoading(true);
        setError(null);
        try {
            const form = new FormData();
            form.append("file", docxFile);
            audioFiles.forEach((af) => form.append("audioFiles", af));

            const res = await fetch(`${API_BASE}/tests/import?preview=true`, {
                method: "POST",
                body: form,
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.message || "Preview failed");
            }
            const data = await res.json();
            setPreview(data);
            setStep("preview");
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    // ── Confirm import ───────────────────────────────────────────────────────

    const handleImport = async () => {
        if (!docxFile) return;
        setLoading(true);
        setError(null);
        try {
            const form = new FormData();
            form.append("file", docxFile);
            form.append("adminId", ADMIN_ID);
            audioFiles.forEach((af) => form.append("audioFiles", af));

            const res = await fetch(`${API_BASE}/tests/import`, {
                method: "POST",
                body: form,
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.message || "Import failed");
            }
            const data = await res.json();
            setImportedId(data.testId);
            setStep("done");
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    // ─── Render ──────────────────────────────────────────────────────────────────

    return (
        <div className="p-6 md:p-10 max-w-4xl mx-auto flex flex-col gap-8">
            {/* Header */}
            <div className="flex items-center gap-3">
                <Link
                    href="/admin/tests"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                >
                    <span className="material-symbols-outlined">arrow_back</span>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Import Test</h1>
                    <p className="text-sm text-muted-foreground">
                        Upload a <code>.docx</code> file using the signal format to auto-create a
                        test
                    </p>
                </div>
            </div>

            {/* Step indicator */}
            <StepIndicator current={step} />

            {/* ── Step 1: Upload ─────────────────────────────────────────────── */}
            {step === "upload" && (
                <div className="flex flex-col gap-6">
                    {/* Dropzone */}
                    <div
                        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                        onDragLeave={() => setDragging(false)}
                        onDrop={onDrop}
                        onClick={() => docxRef.current?.click()}
                        className={`relative flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-12 text-center cursor-pointer transition-all
              ${dragging ? "border-orange-500 bg-orange-500/5" : "border-border hover:border-orange-300 hover:bg-muted/50"}`}
                    >
                        <span className="material-symbols-outlined text-5xl text-muted-foreground">
                            upload_file
                        </span>
                        {docxFile ? (
                            <>
                                <p className="font-semibold text-lg">{docxFile.name}</p>
                                <p className="text-sm text-muted-foreground">
                                    {(docxFile.size / 1024).toFixed(0)} KB — click to change
                                </p>
                            </>
                        ) : (
                            <>
                                <p className="font-semibold text-lg">Drag & drop your .docx file</p>
                                <p className="text-sm text-muted-foreground">
                                    or click to browse — supports IELTS signal format
                                </p>
                            </>
                        )}
                        <input
                            ref={docxRef}
                            type="file"
                            accept=".docx"
                            className="hidden"
                            onChange={(e) => setDocxFile(e.target.files?.[0] || null)}
                        />
                    </div>

                    {/* Audio upload (optional) */}
                    <div className="rounded-xl border bg-card p-5 flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium text-sm">Audio Files (Listening)</p>
                                <p className="text-xs text-muted-foreground">Optional — upload MP3/M4A files referenced in DOCX</p>
                            </div>
                            <button
                                onClick={() => audioRef.current?.click()}
                                className="text-sm px-3 py-1.5 rounded-lg border hover:bg-muted transition-colors"
                            >
                                + Add MP3
                            </button>
                        </div>
                        {audioFiles.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {audioFiles.map((af, i) => (
                                    <span key={i} className="flex items-center gap-1 text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                                        <span className="material-symbols-outlined text-sm">music_note</span>
                                        {af.name}
                                        <button onClick={() => setAudioFiles(audioFiles.filter((_, j) => j !== i))} className="hover:text-red-500">×</button>
                                    </span>
                                ))}
                            </div>
                        )}
                        <input
                            ref={audioRef}
                            type="file"
                            accept=".mp3,.m4a,.wav"
                            multiple
                            className="hidden"
                            onChange={(e) => setAudioFiles(Array.from(e.target.files || []))}
                        />
                    </div>

                    {/* Format hint */}
                    <div className="rounded-xl border bg-muted/30 p-5">
                        <p className="text-sm font-semibold mb-2">📋 DOCX Signal Format</p>
                        <pre className="text-xs text-muted-foreground font-mono leading-relaxed overflow-x-auto">{`SKILL: listening
TITLE: Cambridge IELTS 18 – Test 1
IS_MOCK: true

---SECTION 1---
---AUDIO: AudioTrack01.mp3---

[FILL] Questions 1–10
1. The caller's name is ________.
ANSWER: Margaret

[MCQ] Questions 11–14
11. What is the main topic?
A. Climate change
B. Wildlife conservation
C. Urban planning
D. Food security
ANSWER: B`}</pre>
                    </div>

                    {error && <ErrorBox message={error} />}

                    <div className="flex justify-end">
                        <button
                            onClick={handlePreview}
                            disabled={!docxFile || loading}
                            className="px-6 py-2.5 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                        >
                            {loading ? <Spinner /> : <span className="material-symbols-outlined text-sm">visibility</span>}
                            {loading ? "Parsing..." : "Preview Parse"}
                        </button>
                    </div>
                </div>
            )}

            {/* ── Step 2: Preview ─────────────────────────────────────────────── */}
            {step === "preview" && preview && (
                <div className="flex flex-col gap-6">
                    {/* Summary card */}
                    <div className="rounded-xl border bg-card p-6 flex flex-col gap-4">
                        <div className="flex items-start justify-between">
                            <div>
                                <h2 className="text-xl font-bold">{preview.parsed?.title ?? preview.title}</h2>
                                <span className={`mt-1 inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${SKILL_COLORS[(preview.parsed?.skill ?? preview.skill) as string] ?? "bg-gray-100 text-gray-700"}`}>
                                    {(preview.parsed?.skill ?? preview.skill)?.toUpperCase()}
                                </span>
                            </div>
                            <span className="text-xs px-2 py-1 rounded-full bg-muted">
                                {(preview.parsed?.isMock ?? preview.isMock) ? "Mock Test" : "Practice"}
                            </span>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {[
                                { label: "Sections", value: preview.stats?.sections ?? 0, icon: "layers" },
                                { label: "Questions", value: preview.stats?.questions ?? 0, icon: "quiz" },
                                { label: "Writing Tasks", value: preview.stats?.writingTasks ?? 0, icon: "edit_note" },
                                { label: "Speaking Parts", value: preview.stats?.speakingParts ?? 0, icon: "record_voice_over" },
                            ].map((s) => (
                                <div key={s.label} className="rounded-lg bg-muted/50 p-3 flex flex-col gap-1">
                                    <span className="material-symbols-outlined text-muted-foreground text-sm">{s.icon}</span>
                                    <p className="text-2xl font-bold">{s.value}</p>
                                    <p className="text-xs text-muted-foreground">{s.label}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Sections detail */}
                    {(preview.parsed?.sections ?? preview.sections ?? []).length > 0 && (
                        <div className="rounded-xl border bg-card divide-y overflow-hidden">
                            {(preview.parsed?.sections ?? preview.sections ?? []).map((sec: any, idx: number) => (
                                <div key={idx} className="p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="font-semibold text-sm">Section {sec.sectionOrder}</span>
                                        {sec.audioFilename && (
                                            <span className="flex items-center gap-1 text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                                                <span className="material-symbols-outlined text-xs">music_note</span>
                                                {sec.audioFilename}
                                            </span>
                                        )}
                                        <span className="text-xs text-muted-foreground ml-auto">{sec.questions?.length ?? 0} questions</span>
                                    </div>
                                    {sec.questions?.slice(0, 3).map((q: any, qi: number) => (
                                        <div key={qi} className="text-xs text-muted-foreground py-0.5 pl-3 border-l-2 border-muted">
                                            <span className="font-mono mr-2">Q{q.questionOrder}</span>
                                            <span className="px-1.5 py-0.5 rounded bg-muted text-[10px] mr-2">{q.questionType}</span>
                                            {q.questionText?.slice(0, 60)}{q.questionText?.length > 60 ? "…" : ""}
                                        </div>
                                    ))}
                                    {(sec.questions?.length ?? 0) > 3 && (
                                        <p className="text-xs text-muted-foreground pl-3 pt-1">
                                            + {sec.questions.length - 3} more questions
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {error && <ErrorBox message={error} />}

                    <div className="flex justify-between">
                        <button
                            onClick={() => { setStep("upload"); setPreview(null); }}
                            className="px-4 py-2.5 rounded-xl border hover:bg-muted font-medium text-sm transition-colors"
                        >
                            ← Back
                        </button>
                        <button
                            onClick={handleImport}
                            disabled={loading}
                            className="px-6 py-2.5 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 disabled:opacity-50 transition-colors flex items-center gap-2"
                        >
                            {loading ? <Spinner /> : <span className="material-symbols-outlined text-sm">cloud_upload</span>}
                            {loading ? "Importing…" : "Confirm Import"}
                        </button>
                    </div>
                </div>
            )}

            {/* ── Step 3: Done ─────────────────────────────────────────────────── */}
            {step === "done" && importedId && (
                <div className="flex flex-col items-center gap-6 py-12 text-center">
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
                        <span className="material-symbols-outlined text-5xl text-green-600">check_circle</span>
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold">Test Imported!</h2>
                        <p className="text-muted-foreground mt-1">Your test has been saved to the database.</p>
                        <p className="text-xs font-mono text-muted-foreground mt-2">ID: {importedId}</p>
                    </div>
                    <div className="flex gap-3">
                        <Link
                            href={`/admin/tests/${importedId}`}
                            className="px-5 py-2.5 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 transition-colors"
                        >
                            View Test
                        </Link>
                        <button
                            onClick={() => { setStep("upload"); setDocxFile(null); setAudioFiles([]); setPreview(null); setImportedId(null); }}
                            className="px-5 py-2.5 rounded-xl border hover:bg-muted font-medium transition-colors"
                        >
                            Import Another
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StepIndicator({ current }: { current: "upload" | "preview" | "done" }) {
    const steps = [
        { key: "upload", label: "Upload" },
        { key: "preview", label: "Preview" },
        { key: "done", label: "Done" },
    ];
    const idx = steps.findIndex((s) => s.key === current);
    return (
        <div className="flex items-center gap-2">
            {steps.map((s, i) => (
                <div key={s.key} className="flex items-center gap-2 flex-1">
                    <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold
            ${i <= idx ? "bg-orange-500 text-white" : "bg-muted text-muted-foreground"}`}>
                        {i < idx ? "✓" : i + 1}
                    </div>
                    <span className={`text-sm font-medium ${i <= idx ? "text-foreground" : "text-muted-foreground"}`}>{s.label}</span>
                    {i < steps.length - 1 && <div className={`flex-1 h-px ${i < idx ? "bg-orange-500" : "bg-border"}`} />}
                </div>
            ))}
        </div>
    );
}

function ErrorBox({ message }: { message: string }) {
    return (
        <div className="flex items-start gap-3 rounded-xl bg-red-50 border border-red-200 text-red-700 p-4 text-sm">
            <span className="material-symbols-outlined text-lg shrink-0">error</span>
            {message}
        </div>
    );
}

function Spinner() {
    return (
        <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
    );
}
