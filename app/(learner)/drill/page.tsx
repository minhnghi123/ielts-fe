"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { QuestionItem } from "@/app/practice/[id]/_components/shared/test-question-item";
import { drillsApi, type DrillBuild, type DrillCheck, type DrillItem } from "@/lib/api/drills";
import { errorCauseAdvice, errorCauseLabel, type ErrorCause } from "@/lib/error-causes";
import { tutorApi, selfCauseOptions, type HintResult } from "@/lib/api/tutor";
import { QUESTION_TYPE_HINTS_VI, QUESTION_TYPE_LABELS_VI, normalizeQuestionType } from "@/lib/question-types";

type Phase = "loading" | "error" | "empty" | "question" | "feedback" | "done";

const ENTITIES: Record<string, string> = { nbsp: " ", amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", hellip: "…", ndash: "–", mdash: "—", lsquo: "‘", rsquo: "’", ldquo: "“", rdquo: "”" };

/** Rich-text from the admin editor → plain text: tags become line breaks/spaces, HTML entities are decoded. */
function stripHtml(s: string) {
    return s
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<\/(p|div|li|h[1-6])>/gi, "\n")
        .replace(/<[^>]+>/g, "")
        .replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, code: string) => {
            if (code[0] === "#") {
                const n = code[1].toLowerCase() === "x" ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
                return Number.isFinite(n) && n > 0 ? String.fromCodePoint(n) : m;
            }
            return ENTITIES[code.toLowerCase()] ?? m;
        })
        .replace(/\u00a0/g, " ");
}

function paragraphWithQuote(passage: string | null, quote: string | null, paragraph: number | null) {
    if (!passage) return null;
    const paras = stripHtml(passage).split(/\n+/).map((p) => p.trim()).filter(Boolean);
    if (paragraph != null && paras[paragraph - 1]) return paras[paragraph - 1];
    if (quote) return paras.find((p) => p.toLowerCase().includes(quote.toLowerCase())) ?? null;
    return null;
}

function SelfCause({ questionId, questionType, skill, autoCause }: { questionId: string; questionType: string; skill: string; autoCause: string | null }) {
    const [picked, setPicked] = useState<ErrorCause | null>(null);
    const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");
    const [agrees, setAgrees] = useState<boolean | null>(null);
    const choose = async (c: ErrorCause) => {
        setPicked(c); setState("saving");
        const attempt = () => tutorApi.selfCause({ questionId, selfCause: c });
        try {
            let r;
            try { r = await attempt(); } catch { await new Promise((res) => setTimeout(res, 1200)); r = await attempt(); }
            setAgrees(r.agrees); setState("saved");
        } catch { setState("error"); }
    };
    return (
        <div className="rounded-md border border-border bg-background px-3 py-2 space-y-1.5">
            <p className="text-xs font-medium">Vì sao bạn chọn đáp án này? <span className="font-normal text-muted-foreground">Tự nhìn lại giúp nhớ lâu hơn và giúp hệ thống hiểu đúng lỗi của bạn.</span></p>
            <div className="flex flex-wrap gap-1.5">
                {selfCauseOptions(questionType, skill).map((c) => (
                    <button key={c} type="button" disabled={state === "saving" || state === "saved"} onClick={() => choose(c)}
                        className={`rounded-full border px-2.5 py-0.5 text-xs ${picked === c ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-muted"}`}>
                        {c === "unknown" ? "Mình đoán" : errorCauseLabel(c)}
                    </button>
                ))}
            </div>
            {state === "saved" && picked && (
                <p className="text-xs text-muted-foreground">
                    {agrees ? "Trùng với nhận định của hệ thống. " : autoCause ? `Hệ thống đoán là “${errorCauseLabel(autoCause)}”, nhưng mình tin bạn — đã ghi lại theo lựa chọn của bạn. ` : "Đã ghi lại. "}
                    <span className="text-foreground">{errorCauseAdvice(picked)}</span>
                </p>
            )}
            {state === "error" && <p className="text-xs text-rose-600">Chưa lưu được, bạn có thể bỏ qua.</p>}
        </div>
    );
}

function Feedback({ item, check, skill, hintLevel }: { item: DrillItem; check: DrillCheck; skill: string; hintLevel: number }) {
    const quote = check.evidenceAnchor?.quote ?? null;
    const para = paragraphWithQuote(item.passage, quote, check.evidenceAnchor?.kind === "passage" ? check.evidenceAnchor.paragraph ?? null : null);
    const startMs = check.evidenceAnchor?.kind === "audio" ? check.evidenceAnchor.startMs ?? null : null;
    const type = normalizeQuestionType(item.question.questionType);
    return (
        <div className={`rounded-lg border p-4 space-y-3 text-sm ${check.isCorrect ? "border-emerald-200 bg-emerald-50/60" : "border-rose-200 bg-rose-50/50"}`}>
            <p className="font-semibold">
                {check.isCorrect ? (hintLevel > 0 ? `Chính xác (có dùng ${hintLevel} gợi ý).` : "Chính xác.") : "Chưa đúng."}
                <span className="ml-2 font-normal text-muted-foreground">Đáp án: <span className="font-mono font-semibold text-foreground">{check.correctAnswers.join(" / ") || "—"}</span></span>
            </p>
            {!check.isCorrect && check.errorCause && (
                <p>
                    <span className="rounded-full bg-background border border-border px-2.5 py-0.5 text-xs font-medium">{errorCauseLabel(check.errorCause)}</span>
                    <span className="ml-2 text-xs text-muted-foreground">{errorCauseAdvice(check.errorCause)}</span>
                </p>
            )}
            {!check.isCorrect && <SelfCause questionId={item.question.id} questionType={item.question.questionType} skill={skill} autoCause={check.errorCause} />}
            {(quote || para || startMs != null) && (
                <div className="rounded-md border border-amber-200 bg-amber-50/70 px-3 py-2 space-y-1">
                    <p className="text-[11px] font-medium text-amber-800">Bằng chứng trong bài{startMs != null ? ` · tại ${Math.floor(startMs / 60000)}:${String(Math.floor((startMs % 60000) / 1000)).padStart(2, "0")}` : ""}</p>
                    {quote && <p className="italic">“{quote}”</p>}
                    {para && !quote && <p className="text-xs leading-relaxed">{para}</p>}
                    {startMs != null && item.audioUrl && skill === "listening" && (
                        <audio controls preload="none" src={`${item.audioUrl}#t=${Math.max(0, Math.floor(startMs / 1000) - 3)}`} className="h-8 w-full" />
                    )}
                </div>
            )}
            {check.explanation ? (
                <p className="leading-relaxed">{check.explanation}</p>
            ) : (
                type && <p className="text-xs text-muted-foreground">{QUESTION_TYPE_HINTS_VI[type]}</p>
            )}
        </div>
    );
}

function DrillInner() {
    const sp = useSearchParams();
    const skill = (sp.get("skill") === "listening" ? "listening" : "reading") as "listening" | "reading";
    const questionType = sp.get("questionType") ?? undefined;
    const errorCause = sp.get("errorCause") ?? undefined;

    const [phase, setPhase] = useState<Phase>("loading");
    const [drill, setDrill] = useState<DrillBuild | null>(null);
    const [idx, setIdx] = useState(0);
    const [answer, setAnswer] = useState("");
    const [check, setCheck] = useState<DrillCheck | null>(null);
    const [results, setResults] = useState<DrillCheck[]>([]);
    const [checking, setChecking] = useState(false);
    const [err, setErr] = useState<string | null>(null);
    const [showPassage, setShowPassage] = useState(false);
    const [hintLevel, setHintLevel] = useState(0);
    const [hint, setHint] = useState<HintResult | null>(null);
    const [hintBusy, setHintBusy] = useState(false);
    const [hintErr, setHintErr] = useState<string | null>(null);
    const [hintsUsed, setHintsUsed] = useState(0);
    const started = useRef(false);

    useEffect(() => {
        if (started.current) return;
        started.current = true;
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const item = drill?.items[idx];
    const canonicalItem = item ? normalizeQuestionType(item.question.questionType) : null;
    const total = drill?.items.length ?? 0;
    const canonical = questionType ? normalizeQuestionType(questionType) : null;
    const title = canonical ? `Luyện ${QUESTION_TYPE_LABELS_VI[canonical]}` : errorCause ? `Sửa lỗi: ${errorCauseLabel(errorCause)}` : `Luyện ${skill === "reading" ? "Reading" : "Listening"}`;

    const grade = async (value: string) => {
        if (!item || checking) return;
        setChecking(true);
        setErr(null);
        try {
            const c = await drillsApi.check(skill, item.question.id, value, hintLevel || undefined);
            if (hintLevel > 0) setHintsUsed((n) => n + 1);
            setCheck(c);
            setResults((r) => [...r, c]);
            setPhase("feedback");
        } catch {
            setErr("Không chấm được câu này. Thử lại.");
        } finally {
            setChecking(false);
        }
    };

    const askHint = async () => {
        if (!item || hintBusy || hintLevel >= 3) return;
        const nextLevel = hintLevel + 1;
        setHintErr(null);
        if (nextLevel === 1) { setHintLevel(1); return; }
        setHintBusy(true);
        try {
            const h = await tutorApi.hint({ questionId: item.question.id, level: nextLevel as 2 | 3, skill, questionType: item.question.questionType, questionText: item.question.questionText ?? "", instructions: item.instructions, passage: item.passage, options: (item.question as { config?: { options?: unknown } }).config?.options ?? null });
            setHint(h);
            setHintLevel(nextLevel);
            if (nextLevel === 2 && skill === "reading" && item.passage) setShowPassage(true);
        } catch (e) {
            setHintErr(e instanceof Error ? e.message : "Không lấy được gợi ý");
        } finally {
            setHintBusy(false);
        }
    };

    const load = () => {
        setPhase("loading");
        setDrill(null);
        setIdx(0);
        setAnswer("");
        setCheck(null);
        setResults([]);
        drillsApi
            .build({ skill, questionType, errorCause, limit: 8 })
            .then((d) => { setDrill(d); setPhase(d.items.length ? "question" : "empty"); })
            .catch(() => setPhase("error"));
    };

    const next = () => {
        setCheck(null);
        setAnswer("");
        setShowPassage(false);
        setHintLevel(0); setHint(null); setHintErr(null);
        if (idx + 1 >= total) setPhase("done");
        else { setIdx((i) => i + 1); setPhase("question"); }
    };

    const correct = results.filter((r) => r.isCorrect).length;
    const hintNote = hintsUsed > 0 ? ` · ${hintsUsed} câu có dùng gợi ý` : "";

    return (
        <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
            <Breadcrumb items={[{ label: "Sổ lỗi", href: "/mistakes" }, { label: "Luyện tập" }]} />
            <div className="flex items-end justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold">{title}</h1>
                    <p className="text-sm text-muted-foreground">
                        {phase === "question" || phase === "feedback"
                            ? `Câu ${idx + 1}/${total}${drill?.meta.fromNotebook ? ` · ${drill.meta.fromNotebook} câu ôn lại từ sổ lỗi` : ""}`
                            : "Trả lời từng câu, nhận phản hồi ngay, không tính vào band."}
                    </p>
                </div>
                {total > 0 && phase !== "done" && (
                    <div className="h-1.5 w-32 rounded-full bg-muted overflow-hidden">
                        <div className="h-full bg-primary transition-all" style={{ width: `${(results.length / total) * 100}%` }} />
                    </div>
                )}
            </div>

            {phase === "loading" && <p className="text-sm text-muted-foreground">Đang chọn câu phù hợp với bạn…</p>}
            {phase === "error" && <p className="text-sm text-rose-600">Không tạo được bài luyện. Thử tải lại trang.</p>}
            {phase === "empty" && (
                <Card className="bg-card shadow-sm"><CardContent className="p-8 text-center space-y-3">
                    <p className="text-sm text-muted-foreground">Chưa có câu nào cho dạng này. Làm thêm một đề {skill === "reading" ? "Reading" : "Listening"} để hệ thống có dữ liệu.</p>
                    <Link href="/tests"><Button size="sm">Chọn đề luyện</Button></Link>
                </CardContent></Card>
            )}

            {item && (phase === "question" || phase === "feedback") && (
                <Card className="bg-card shadow-sm">
                    <CardContent className="p-5 space-y-4">
                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            {item.fromNotebook && <span className="rounded-full bg-amber-100 text-amber-900 px-2 py-0.5 font-medium">Ôn lại</span>}
                            {item.testTitle && <span>{item.testTitle}</span>}
                        </div>
                        {item.instructions && <p className="text-sm text-muted-foreground whitespace-pre-line">{stripHtml(item.instructions)}</p>}

                        {skill === "reading" && item.passage && (
                            <div className="rounded-md border border-border">
                                <button type="button" onClick={() => setShowPassage((v) => !v)} className="w-full px-3 py-2 text-left text-xs font-medium hover:bg-muted">
                                    {showPassage ? "Ẩn bài đọc" : "Mở bài đọc"}
                                </button>
                                {showPassage && <div className="max-h-72 overflow-y-auto px-3 pb-3 text-sm leading-relaxed whitespace-pre-line">{stripHtml(item.passage)}</div>}
                            </div>
                        )}
                        {skill === "listening" && item.audioUrl && (
                            <audio controls preload="none" src={item.startMs != null ? `${item.audioUrl}#t=${Math.floor(item.startMs / 1000)}` : item.audioUrl} className="h-9 w-full" />
                        )}

                        <div className={phase === "feedback" ? "pointer-events-none opacity-80" : ""}>
                            <QuestionItem question={item.question} answer={answer} onAnswerChange={(_, v) => setAnswer(v)} displayOrder={idx + 1} />
                        </div>

                        {phase === "question" && (hintLevel > 0 || hintErr) && (
                            <div className="rounded-md border border-sky-200 bg-sky-50/70 px-3 py-2 text-sm space-y-1" aria-live="polite">
                                <p className="text-[11px] font-medium text-sky-800">Gợi ý {hintLevel}/3 — không có đáp án, chỉ có cách tìm</p>
                                {hintLevel >= 1 && canonicalItem && <p><span className="font-medium">Chiến lược:</span> {QUESTION_TYPE_HINTS_VI[canonicalItem]}</p>}
                                {hintLevel >= 2 && hint && <p><span className="font-medium">Tìm ở đâu:</span> {hint.paragraph ? `đoạn ${hint.paragraph}. ` : ""}{hint.location ?? "Hãy đọc lướt từng đoạn tìm ý của câu hỏi."}</p>}
                                {hintLevel >= 3 && hint && (
                                    <p><span className="font-medium">Từ khoá được diễn đạt lại:</span> {hint.keywords.length ? hint.keywords.map((k) => <span key={k} className="mx-0.5 rounded bg-background px-1.5 py-0.5 font-mono text-xs border border-border">{k}</span>) : "không tìm được từ khoá chắc chắn"}{hint.paraphrase ? ` — ${hint.paraphrase}` : ""}</p>
                                )}
                                {hintErr && <p className="text-xs text-rose-600">{hintErr}</p>}
                            </div>
                        )}
                        {phase === "question" ? (
                            <div className="flex items-center gap-3">
                                <Button onClick={() => grade(answer)} disabled={!answer.trim() || checking}>{checking ? "Đang chấm…" : "Kiểm tra"}</Button>
                                {hintLevel < 3 && (
                                    <Button variant="outline" size="sm" onClick={askHint} disabled={hintBusy || checking}>{hintBusy ? "Đang lấy gợi ý…" : hintLevel === 0 ? "Gợi ý" : `Gợi ý thêm (${hintLevel}/3)`}</Button>
                                )}
                                <button type="button" disabled={checking} onClick={() => { setAnswer(""); void grade(""); }} className="text-xs text-muted-foreground hover:underline">
                                    Bỏ qua, xem đáp án
                                </button>
                                {err && <span className="text-xs text-rose-600">{err}</span>}
                            </div>
                        ) : (
                            check && (
                                <>
                                    <Feedback item={item} check={check} skill={skill} hintLevel={hintLevel} />
                                    <Button onClick={next}>{idx + 1 >= total ? "Xem kết quả" : "Câu tiếp theo"}</Button>
                                </>
                            )
                        )}
                    </CardContent>
                </Card>
            )}

            {phase === "done" && (
                <Card className="bg-card shadow-sm">
                    <CardContent className="p-6 space-y-4">
                        <p className="text-lg font-semibold">Đúng {correct}/{total}<span className="text-sm font-normal text-muted-foreground">{hintNote}</span></p>
                        <p className="text-sm text-muted-foreground">
                            {correct === total
                                ? "Bạn đã nắm dạng này trong bài luyện hôm nay. Câu từ sổ lỗi trả lời đúng 2 lần liên tiếp sẽ được đánh dấu đã nắm."
                                : correct >= total / 2
                                  ? "Khá ổn. Những câu sai đã vào sổ lỗi với nguyên nhân để bạn ôn lại."
                                  : "Dạng này còn khó với bạn. Đọc kỹ lời khuyên theo nguyên nhân rồi luyện thêm một lượt."}
                        </p>
                        {results.some((r) => !r.isCorrect) && (
                            <div className="flex flex-wrap gap-1.5">
                                {Object.entries(results.filter((r) => !r.isCorrect && r.errorCause).reduce<Record<string, number>>((acc, r) => { acc[r.errorCause!] = (acc[r.errorCause!] ?? 0) + 1; return acc; }, {})).map(([k, n]) => (
                                    <span key={k} className="rounded-full border border-border px-2.5 py-0.5 text-xs">{errorCauseLabel(k)} · {n}</span>
                                ))}
                            </div>
                        )}
                        <div className="flex flex-wrap gap-2">
                            <Button onClick={load}>Luyện lượt nữa</Button>
                            <Link href="/mistakes"><Button variant="outline">Về sổ lỗi</Button></Link>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

export default function DrillPage() {
    return (
        <Suspense fallback={<p className="p-6 text-sm text-muted-foreground">Đang tải…</p>}>
            <DrillInner />
        </Suspense>
    );
}
