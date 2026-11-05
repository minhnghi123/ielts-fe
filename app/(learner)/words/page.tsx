"use client";

import { halfLifeLabel } from "@/lib/api/memory";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { wordsApi, type SavedWord } from "@/lib/api/words";

/**
 * Sổ từ vựng: ôn các từ đến hạn theo kiểu thẻ lật (Quên / Nhớ / Dễ), rồi danh sách toàn bộ từ đã lưu.
 */
export default function WordsPage() {
    const qc = useQueryClient();
    const all = useQuery({ queryKey: ["words", "all"], queryFn: () => wordsApi.list(false) });
    const words = all.data ?? [];
    const due = useMemo(() => words.filter((w) => !w.nextReviewAt || new Date(w.nextReviewAt) <= new Date()), [words]);
    const invalidate = () => qc.invalidateQueries({ queryKey: ["words"] });

    const [reviewedIds, setReviewedIds] = useState<Set<string>>(() => new Set());
    const [revealed, setRevealed] = useState(false);
    const review = useMutation({
        mutationFn: ({ id, q }: { id: string; q: "again" | "good" | "easy" }) => wordsApi.review(id, q),
        onSuccess: (_d, { id }) => { setRevealed(false); setReviewedIds((prev) => new Set(prev).add(id)); invalidate(); },
    });
    const remove = useMutation({ mutationFn: (id: string) => wordsApi.remove(id), onSuccess: invalidate });
    const update = useMutation({ mutationFn: ({ id, meaningVi }: { id: string; meaningVi: string }) => wordsApi.update(id, { meaningVi }), onSuccess: invalidate });
    const add = useMutation({ mutationFn: (input: { word: string; meaningVi?: string }) => wordsApi.add(input), onSuccess: () => { setNewWord(""); setNewMeaning(""); invalidate(); } });
    const [newWord, setNewWord] = useState("");
    const [newMeaning, setNewMeaning] = useState("");

    // Session queue keyed by id, not index: a word added mid-session becomes reviewable without reload.
    const current: SavedWord | undefined = due.find((w) => !reviewedIds.has(w.id));
    const reviewedToday = words.filter((w) => reviewedIds.has(w.id)).length;

    return (
        <div className="mx-auto max-w-3xl space-y-6 p-4 md:p-6">
            <div>
                <h1 className="text-2xl font-semibold">Sổ từ vựng</h1>
                <p className="text-sm text-muted-foreground">Từ bạn lưu khi đọc bài. Lịch ôn do mô hình quên tính riêng cho bạn: mỗi lần nhớ, thời gian nhớ được kéo dài; mỗi lần quên, rút ngắn. Quên → mai gặp lại, Nhớ → giãn dần, Dễ → giãn nhanh hơn.</p>
            </div>

            <Card>
                <CardContent className="p-5">
                    {all.isLoading && <p className="text-sm text-muted-foreground">Đang tải sổ từ…</p>}
                    {all.isError && <p className="text-sm text-rose-600">Không tải được sổ từ.</p>}
                    {all.data && due.length === 0 && <p className="text-sm text-muted-foreground">Hôm nay không có từ nào đến hạn ôn.</p>}
                    {all.data && due.length > 0 && !current && <p className="text-sm text-emerald-700">Đã ôn xong {reviewedToday} từ hôm nay.</p>}
                    {current && (
                        <div className="space-y-4">
                            <p className="text-xs text-muted-foreground">Ôn {reviewedToday + 1}/{reviewedToday + due.filter((w) => !reviewedIds.has(w.id)).length}</p>
                            <p className="text-3xl font-semibold">{current.word}</p>
                            {current.halfLifeH != null && <p className="text-xs text-muted-foreground">Bạn thường nhớ từ này {halfLifeLabel(current.halfLifeH)} · đã nhớ {current.correctCount ?? 0} / quên {current.lapseCount ?? 0} lần</p>}
                            {current.context && <p className="text-sm italic text-muted-foreground">“{current.context}”</p>}
                            {!revealed ? (
                                <Button onClick={() => setRevealed(true)}>Xem nghĩa</Button>
                            ) : (
                                <div className="space-y-3">
                                    <p className="text-base">{current.meaningVi || <span className="text-muted-foreground">Chưa có nghĩa — thêm ở danh sách bên dưới.</span>}</p>
                                    <div className="flex gap-2">
                                        <Button variant="outline" disabled={review.isPending} onClick={() => review.mutate({ id: current.id, q: "again" })}>Quên</Button>
                                        <Button disabled={review.isPending} onClick={() => review.mutate({ id: current.id, q: "good" })}>Nhớ</Button>
                                        <Button variant="secondary" disabled={review.isPending} onClick={() => review.mutate({ id: current.id, q: "easy" })}>Dễ</Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            <form
                className="flex flex-wrap gap-2"
                onSubmit={(e) => { e.preventDefault(); if (newWord.trim()) add.mutate({ word: newWord.trim(), meaningVi: newMeaning.trim() || undefined }); }}
            >
                <Input value={newWord} onChange={(e) => setNewWord(e.target.value)} placeholder="Từ tiếng Anh" className="h-9 w-44" maxLength={80} />
                <Input value={newMeaning} onChange={(e) => setNewMeaning(e.target.value)} placeholder="Nghĩa tiếng Việt (tuỳ chọn)" className="h-9 flex-1 min-w-[200px]" maxLength={400} />
                <Button type="submit" size="sm" className="h-9" disabled={!newWord.trim() || add.isPending}>Thêm từ</Button>
            </form>

            <div className="space-y-1">
                <p className="text-sm font-medium">Tất cả ({words.length})</p>
                {words.length === 0 && all.data && <p className="text-sm text-muted-foreground">Chưa có từ nào. Khi làm bài Reading, bôi đen một từ rồi bấm “Lưu từ”.</p>}
                <ul className="divide-y divide-border rounded-lg border border-border">
                    {words.map((w) => (
                        <li key={w.id} className="flex flex-wrap items-center gap-2 px-3 py-2 text-sm">
                            <span className="font-medium min-w-[120px]">{w.word}</span>
                            <input
                                defaultValue={w.meaningVi ?? ""}
                                placeholder="Thêm nghĩa tiếng Việt"
                                className="flex-1 min-w-[160px] bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                                onBlur={(e) => { if (e.target.value !== (w.meaningVi ?? "")) update.mutate({ id: w.id, meaningVi: e.target.value }); }}
                            />
                            <span className="text-[11px] text-muted-foreground">
                                {w.halfLifeH != null ? `nhớ ${halfLifeLabel(w.halfLifeH)} · ${w.correctCount ?? 0}✓ ${w.lapseCount ?? 0}✗ · ` : ""}{w.nextReviewAt && new Date(w.nextReviewAt) > new Date() ? `ôn lại ${new Date(w.nextReviewAt).toLocaleDateString("vi-VN")}` : "đến hạn"} · {w.reviewCount} lần
                            </span>
                            <button type="button" className="text-xs text-muted-foreground hover:text-rose-600" onClick={() => remove.mutate(w.id)}>Xoá</button>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}
