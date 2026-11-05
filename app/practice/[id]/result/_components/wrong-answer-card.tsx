"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Loader2, ThumbsDown, ThumbsUp } from "lucide-react";
import { analyticsApi } from "@/lib/api/analytics";
import { errorCauseAdvice, errorCauseLabel, type ErrorCause } from "@/lib/error-causes";
import { tutorApi, selfCauseOptions } from "@/lib/api/tutor";
import { QUESTION_TYPE_HINTS_VI, normalizeQuestionType } from "@/lib/question-types";
import type { EvidenceAnchor } from "@/lib/types";

export interface ExplainResult {
    source: "author" | "teacher" | "ai";
    explanationId?: string;
    errorCause: string | null;
    evidenceQuote: string | null;
    evidenceParagraph: number | null;
    evidenceStartMs: number | null;
    explanationVi: string;
    tipVi: string | null;
}

export interface WrongAnswerCardProps {
    attemptId: string;
    questionId: string;
    number: number;
    questionType: string;
    questionText?: string;
    userAnswer: string;
    correctAnswers: string[];
    skill: string;
    passage?: string | null;
    audioUrl?: string | null;
    evidenceAnchor?: EvidenceAnchor | null;
    authorExplanation?: string | null;
    /** From the mistake notebook when already classified server-side. */
    errorCause?: string | null;
}

const fmtMs = (ms: number) => {
    const s = Math.floor(ms / 1000);
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

function paragraphs(passage: string): string[] {
    const plain = passage.replace(/<br\s*\/?>/gi, "\n").replace(/<\/p>/gi, "\n").replace(/<[^>]+>/g, "");
    return plain.split(/\n{1,}/).map((p) => p.trim()).filter(Boolean);
}

function Highlighted({ text, quote }: { text: string; quote: string | null }) {
    if (!quote) return <>{text}</>;
    const i = text.toLowerCase().indexOf(quote.toLowerCase());
    if (i < 0) return <>{text}</>;
    return (
        <>
            {text.slice(0, i)}
            <mark className="bg-amber-100 text-foreground rounded px-0.5">{text.slice(i, i + quote.length)}</mark>
            {text.slice(i + quote.length)}
        </>
    );
}

export function WrongAnswerCard(p: WrongAnswerCardProps) {
    const [selfCause, setSelfCause] = useState<ErrorCause | null>(null);
    const [selfState, setSelfState] = useState<"idle" | "saving" | "saved" | "error">("idle");
    const pickSelfCause = async (c: ErrorCause) => {
        setSelfCause(c); setSelfState("saving");
        try { await tutorApi.selfCause({ questionId: p.questionId, attemptId: p.attemptId, selfCause: c }); setSelfState("saved"); } catch { setSelfState("error"); }
    };
    const [explain, setExplain] = useState<ExplainResult | null>(
        p.authorExplanation
            ? {
                  source: "author",
                  errorCause: p.errorCause ?? null,
                  evidenceQuote: p.evidenceAnchor?.quote ?? null,
                  evidenceParagraph: p.evidenceAnchor?.kind === "passage" ? p.evidenceAnchor.paragraph ?? null : null,
                  evidenceStartMs: p.evidenceAnchor?.kind === "audio" ? p.evidenceAnchor.startMs ?? null : null,
                  explanationVi: p.authorExplanation,
                  tipVi: null,
              }
            : null,
    );
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showPassage, setShowPassage] = useState(false);
    const [voted, setVoted] = useState<boolean | null>(null);

    const skipped = !p.userAnswer.trim();
    const cause = explain?.errorCause ?? p.errorCause ?? (skipped ? "skipped" : null);
    const canonicalType = normalizeQuestionType(p.questionType);
    const quote = explain?.evidenceQuote ?? p.evidenceAnchor?.quote ?? null;
    const paraIdx = explain?.evidenceParagraph ?? (p.evidenceAnchor?.kind === "passage" ? p.evidenceAnchor.paragraph : null) ?? null;
    const startMs = explain?.evidenceStartMs ?? (p.evidenceAnchor?.kind === "audio" ? p.evidenceAnchor.startMs : null) ?? null;

    const paras = p.passage ? paragraphs(p.passage) : [];
    const paraText =
        paraIdx != null && paras[paraIdx - 1]
            ? paras[paraIdx - 1]
            : quote
              ? paras.find((t) => t.toLowerCase().includes(quote.toLowerCase())) ?? null
              : null;

    const loadExplanation = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch("/api/ai/explain-question", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ attemptId: p.attemptId, questionId: p.questionId }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data?.error || "Không tải được giải thích");
            setExplain(data as ExplainResult);
        } catch (e) {
            setError(e instanceof Error ? e.message : "Không tải được giải thích");
        } finally {
            setLoading(false);
        }
    };

    const vote = async (helpful: boolean) => {
        if (!explain?.explanationId || voted != null) return;
        setVoted(helpful);
        try { await analyticsApi.voteExplanation(explain.explanationId, helpful); } catch { /* ignore */ }
    };

    return (
        <div className="rounded-lg border border-border bg-card p-4 space-y-3 text-sm">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="font-semibold">Câu {p.number}</span>
                <span className="text-xs text-muted-foreground">{canonicalType ? canonicalType.replace(/_/g, " ") : p.questionType}</span>
                {cause && (
                    <span className="ml-auto rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-foreground">
                        {errorCauseLabel(cause)}
                    </span>
                )}
            </div>

            {p.questionText && (
                <p className="text-muted-foreground" dangerouslySetInnerHTML={{ __html: p.questionText }} />
            )}

            <div className="grid grid-cols-2 gap-3">
                <div className="rounded-md bg-rose-50 px-3 py-2">
                    <p className="text-[11px] text-rose-700">Bạn trả lời</p>
                    <p className="font-mono text-sm">{skipped ? <em className="text-muted-foreground">bỏ trống</em> : p.userAnswer}</p>
                </div>
                <div className="rounded-md bg-emerald-50 px-3 py-2">
                    <p className="text-[11px] text-emerald-700">Đáp án đúng</p>
                    <p className="font-mono text-sm font-semibold">{p.correctAnswers.join(" / ") || "—"}</p>
                </div>
            </div>

            {(quote || paraText || startMs != null) && (
                <div className="rounded-md border border-amber-200 bg-amber-50/60 px-3 py-2 space-y-1.5">
                    <p className="text-[11px] font-medium text-amber-800">
                        Bằng chứng trong bài
                        {paraIdx != null ? ` · đoạn ${paraIdx}` : ""}
                        {startMs != null ? ` · tại ${fmtMs(startMs)}` : ""}
                    </p>
                    {quote && <p className="italic">“{quote}”</p>}
                    {paraText && (
                        <button
                            type="button"
                            onClick={() => setShowPassage((v) => !v)}
                            className="flex items-center gap-1 text-xs text-foreground/80 hover:underline"
                        >
                            {showPassage ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                            {showPassage ? "Ẩn đoạn văn" : "Xem cả đoạn văn"}
                        </button>
                    )}
                    {showPassage && paraText && (
                        <p className="text-xs leading-relaxed text-foreground/90"><Highlighted text={paraText} quote={quote} /></p>
                    )}
                    {startMs != null && p.audioUrl && (
                        <audio controls preload="none" src={`${p.audioUrl}#t=${Math.max(0, Math.floor(startMs / 1000) - 3)}`} className="h-8 w-full" />
                    )}
                </div>
            )}

            {!skipped && (
                <div className="rounded-md border border-border bg-background px-3 py-2 space-y-1.5">
                    <p className="text-xs font-medium">Vì sao bạn chọn đáp án này?</p>
                    <div className="flex flex-wrap gap-1.5">
                        {selfCauseOptions(p.questionType ?? null, p.skill ?? "reading").map((c) => (
                            <button key={c} type="button" disabled={selfState === "saving" || selfState === "saved"} onClick={() => pickSelfCause(c)}
                                className={`rounded-full border px-2.5 py-0.5 text-xs ${selfCause === c ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-muted"}`}>
                                {c === "unknown" ? "Mình đoán" : errorCauseLabel(c)}
                            </button>
                        ))}
                    </div>
                    {selfState === "saved" && selfCause && <p className="text-xs text-muted-foreground">Đã ghi vào sổ lỗi. {errorCauseAdvice(selfCause)}</p>}
                    {selfState === "error" && <p className="text-xs text-rose-600">Chưa lưu được, bạn có thể bỏ qua.</p>}
                </div>
            )}
            {explain ? (
                <div className="space-y-2">
                    <p className="leading-relaxed">{explain.explanationVi}</p>
                    <p className="text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">Lần sau: </span>
                        {explain.tipVi || errorCauseAdvice(cause)}
                    </p>
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                        <span>{explain.source === "author" ? "Giải thích của người ra đề" : explain.source === "teacher" ? "Giải thích của giáo viên" : "Giải thích do AI tạo, đã kiểm tra trích dẫn"}</span>
                        {explain.source === "ai" && explain.explanationId && (
                            <span className="ml-auto flex items-center gap-1">
                                Hữu ích?
                                <button type="button" aria-label="Hữu ích" disabled={voted != null} onClick={() => vote(true)} className={`rounded p-1 hover:bg-muted ${voted === true ? "text-emerald-600" : ""}`}><ThumbsUp className="h-3.5 w-3.5" /></button>
                                <button type="button" aria-label="Chưa hữu ích" disabled={voted != null} onClick={() => vote(false)} className={`rounded p-1 hover:bg-muted ${voted === false ? "text-rose-600" : ""}`}><ThumbsDown className="h-3.5 w-3.5" /></button>
                            </span>
                        )}
                    </div>
                </div>
            ) : (
                <div className="space-y-2">
                    {cause && <p className="text-xs text-muted-foreground"><span className="font-medium text-foreground">Lần sau: </span>{errorCauseAdvice(cause)}</p>}
                    {canonicalType && !cause && <p className="text-xs text-muted-foreground">{QUESTION_TYPE_HINTS_VI[canonicalType]}</p>}
                    <div className="flex items-center gap-2">
                        <Button type="button" size="sm" variant="outline" className="h-8 text-xs" disabled={loading} onClick={loadExplanation}>
                            {loading ? <><Loader2 className="mr-1 h-3 w-3 animate-spin" /> Đang giải thích…</> : "Giải thích vì sao sai"}
                        </Button>
                        {error && <span className="text-xs text-rose-600">{error}</span>}
                    </div>
                </div>
            )}
        </div>
    );
}
