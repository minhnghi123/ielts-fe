"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { classroomApi } from "@/lib/api/classroom";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { errorCauseLabel } from "@/lib/error-causes";
import { writingErrorLabel } from "@/lib/writing-errors";
import { QUESTION_TYPE_LABELS_VI, normalizeQuestionType } from "@/lib/question-types";

const SKILLS = ["listening", "reading", "writing", "speaking"] as const;
const typeLabel = (t: string) => { const c = normalizeQuestionType(t); return c ? QUESTION_TYPE_LABELS_VI[c] : t; };

export function WeaknessTab({ classId }: { classId: string }) {
    const qc = useQueryClient();
    const { data, isLoading, isError } = useQuery({ queryKey: ["class", classId, "heatmap"], queryFn: () => classroomApi.heatmap(classId), staleTime: 60_000 });
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [skill, setSkill] = useState<string>("reading");
    const [questionType, setQuestionType] = useState<string>("");
    const [note, setNote] = useState("");
    const [done, setDone] = useState<string | null>(null);
    const assign = useMutation({
        mutationFn: () => classroomApi.assignDrill(classId, { learnerIds: [...selected], skill, questionType: questionType || undefined, note: note || undefined }),
        onSuccess: (r) => { setDone(`Đã giao cho ${r.assigned} học viên; bài xuất hiện trong mục Hôm nay của các em.`); setSelected(new Set()); qc.invalidateQueries({ queryKey: ["class", classId, "heatmap"] }); },
    });

    if (isLoading) return <Skeleton className="h-40 w-full" />;
    if (isError || !data) return <p className="text-sm text-rose-600">Không tải được bảng điểm yếu.</p>;
    if (data.rows.length === 0) return <p className="text-sm text-muted-foreground">Lớp chưa có học viên đang hoạt động.</p>;

    const toggle = (id: string) => setSelected((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
    const pickGroup = (w: { key: string; learners: string[] }) => { setSelected(new Set(w.learners)); setQuestionType(w.key); setSkill(skill === "writing" || skill === "speaking" ? "reading" : skill); };

    return (
        <div className="space-y-5">
            {data.classWeakTypes.length > 0 && (
                <div className="rounded-lg border border-border p-4 space-y-2">
                    <p className="text-sm font-semibold">Cả lớp sai nhiều nhất</p>
                    <div className="flex flex-wrap gap-1.5">
                        {data.classWeakTypes.map((w) => (
                            <button key={w.key} type="button" onClick={() => pickGroup(w)} className="rounded-full border border-border px-2.5 py-0.5 text-xs hover:bg-muted" title="Chọn nhóm học viên này">
                                {typeLabel(w.key)} · {w.count} câu · {w.learners.length} HV
                            </button>
                        ))}
                    </div>
                    {data.classTopCauses.length > 0 && <p className="text-xs text-muted-foreground">Nguyên nhân phổ biến: {data.classTopCauses.slice(0, 3).map((c) => `${errorCauseLabel(c.key)} (${c.count})`).join(", ")}</p>}
                    {data.classWritingErrors.length > 0 && <p className="text-xs text-muted-foreground">Lỗi Writing phổ biến: {data.classWritingErrors.slice(0, 3).map((c) => `${writingErrorLabel(c.key)} (${c.count})`).join(", ")}</p>}
                    <p className="text-xs text-muted-foreground">Bấm một dạng để chọn sẵn nhóm học viên yếu dạng đó, rồi giao bài luyện bên dưới.</p>
                </div>
            )}

            <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full text-sm">
                    <thead className="bg-muted/50 text-xs text-muted-foreground">
                        <tr>
                            <th className="p-2 text-left"><input type="checkbox" aria-label="Chọn tất cả" checked={selected.size === data.rows.length} onChange={(e) => setSelected(e.target.checked ? new Set(data.rows.map((r) => r.learnerId)) : new Set())} /></th>
                            <th className="p-2 text-left">Học viên</th>
                            {SKILLS.map((s) => <th key={s} className="p-2 text-center capitalize">{s}</th>)}
                            <th className="p-2 text-left">Dạng yếu</th>
                            <th className="p-2 text-left">Nguyên nhân</th>
                            <th className="p-2 text-left">Writing</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.rows.map((r) => (
                            <tr key={r.learnerId} className="border-t border-border">
                                <td className="p-2"><input type="checkbox" aria-label={`Chọn ${r.fullName ?? r.email ?? ""}`} checked={selected.has(r.learnerId)} onChange={() => toggle(r.learnerId)} /></td>
                                <td className="p-2"><p className="font-medium">{r.fullName ?? r.email ?? r.learnerId.slice(0, 8)}</p><p className="text-[11px] text-muted-foreground">{r.openMistakes} câu chưa nắm</p></td>
                                {SKILLS.map((s) => {
                                    const b = r.bands[s];
                                    const gap = b?.current != null && b?.target != null ? b.target - b.current : null;
                                    const cls = b?.current == null ? "bg-muted/40 text-muted-foreground" : gap != null && gap >= 1 ? "bg-rose-50 text-rose-700" : gap != null && gap > 0 ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700";
                                    return <td key={s} className="p-1 text-center"><span className={`inline-block min-w-[44px] rounded px-1.5 py-0.5 text-xs ${cls}`}>{b?.current != null ? b.current.toFixed(1) : "—"}{b?.target != null ? `/${b.target.toFixed(1)}` : ""}</span></td>;
                                })}
                                <td className="p-2 text-xs">{r.weakTypes.map((w) => `${typeLabel(w.key)} (${w.count})`).join(", ") || "—"}</td>
                                <td className="p-2 text-xs">{r.topCauses.map((c) => errorCauseLabel(c.key)).join(", ") || "—"}</td>
                                <td className="p-2 text-xs">{r.writingErrors.map((c) => `${writingErrorLabel(c.key)} (${c.count})`).join(", ") || "—"}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="rounded-lg border border-border p-4 space-y-3">
                <p className="text-sm font-semibold">Giao bài luyện cho {selected.size} học viên đã chọn</p>
                <div className="flex flex-wrap gap-2 items-center">
                    <select value={skill} onChange={(e) => { setSkill(e.target.value); if (e.target.value === "writing" || e.target.value === "speaking") setQuestionType(""); }} className="h-8 rounded-md border border-input bg-background px-2 text-xs">
                        {SKILLS.map((s) => <option key={s} value={s} className="capitalize">{s}</option>)}
                    </select>
                    {(skill === "reading" || skill === "listening") && (
                        <select value={questionType} onChange={(e) => setQuestionType(e.target.value)} className="h-8 rounded-md border border-input bg-background px-2 text-xs">
                            <option value="">Mọi dạng câu</option>
                            {Object.entries(QUESTION_TYPE_LABELS_VI).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                        </select>
                    )}
                    <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={240} placeholder="Lời nhắn cho học viên (tiếng Việt, tuỳ chọn)" className="h-8 flex-1 min-w-[220px] rounded-md border border-input bg-background px-2 text-xs" />
                    <Button size="sm" disabled={selected.size === 0 || assign.isPending} onClick={() => { setDone(null); assign.mutate(); }}>{assign.isPending ? "Đang giao…" : "Giao bài"}</Button>
                </div>
                {assign.isError && <p className="text-xs text-rose-600">Không giao được. Thử lại.</p>}
                {done && <p className="text-xs text-emerald-700">{done}</p>}
                <p className="text-[11px] text-muted-foreground">Bài được thêm vào kế hoạch tuần này của từng học viên với ưu tiên cao; Reading/Listening là drill theo dạng câu, Writing/Speaking là một bài có chấm AI.</p>
            </div>
        </div>
    );
}
