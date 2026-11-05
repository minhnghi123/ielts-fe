"use client";

import { Suspense, useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { useAuthStore } from "@/stores/auth-store";
import { speakingApi, type SpeakingLevel } from "@/lib/api/speaking";
import { WordLevel } from "./_components/word-level";
import { SentenceBuildLevel } from "./_components/sentence-build-level";
import { SentenceLevel } from "./_components/sentence-level";
import { FreeLevel } from "./_components/free-level";

const LEVELS: Array<{ key: SpeakingLevel; title: string; desc: string; ready: boolean }> = [
    { key: "word", title: "Phát âm từ", desc: "Nghe mẫu, đọc một từ, xem âm nào chưa đúng.", ready: true },
    { key: "sentence_build", title: "Ghép câu", desc: "Xếp từ thành câu đúng rồi đọc to.", ready: true },
    { key: "sentence", title: "Câu dài", desc: "Đọc theo câu 12–25 từ, đo tốc độ và ngắt nghỉ.", ready: true },
    { key: "free", title: "Nói tự do", desc: "Trả lời câu hỏi Part 1 trong 30–60 giây.", ready: true },
];
const MASTERY_VI: Record<string, string> = { chua_du_du_lieu: "chưa đủ dữ liệu", yeu: "yếu", dang_hoc: "đang học", vung: "vững", thanh_thao: "thành thạo" };

/**
 * Luyện nói: tiến độ 4 bậc + âm yếu ở trên, bậc đang luyện ở dưới.
 */
export default function SpeakPage() {
    return <Suspense fallback={<p className="p-6 text-sm text-muted-foreground">Đang tải…</p>}><SpeakInner /></Suspense>;
}

function SpeakInner() {
    const router = useRouter();
    const params = useSearchParams();
    const qc = useQueryClient();
    const user = useAuthStore((s) => s.user);
    const learnerId = (user as { profileId?: string } | null)?.profileId || user?.id || null;
    const level = (params.get("level") as SpeakingLevel | null) ?? "word";
    const sound = params.get("sound");

    const summary = useQuery({ queryKey: ["speak", "summary", learnerId], queryFn: () => speakingApi.summary(learnerId!), enabled: !!learnerId });
    const sounds = useQuery({ queryKey: ["speak", "sounds"], queryFn: speakingApi.sounds, staleTime: Infinity });
    const soundTips = useMemo(() => Object.fromEntries((sounds.data ?? []).map((s) => [s.sound, s.tip])), [sounds.data]);
    const onSaved = () => qc.invalidateQueries({ queryKey: ["speak", "summary"] });
    const go = (l: SpeakingLevel, s?: string | null) => router.push(`/speak?level=${l}${s ? `&sound=${encodeURIComponent(s)}` : ""}`);

    return (
        <div className="mx-auto max-w-3xl space-y-6 p-4 md:p-6">
            <div>
                <h1 className="text-2xl font-semibold">Luyện nói</h1>
                <p className="text-sm text-muted-foreground">Bốn bậc từ dễ đến khó. Mỗi lần ghi âm, máy nhận diện lời bạn nói, so với mẫu và chỉ ra âm chưa đúng.</p>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
                {LEVELS.map((l) => {
                    const st = summary.data?.byLevel[l.key];
                    const active = level === l.key;
                    return (
                        <button key={l.key} type="button" disabled={!l.ready} onClick={() => go(l.key)} aria-pressed={active}
                            className={`rounded-md border p-3 text-left transition-colors ${active ? "border-primary bg-primary/5" : "hover:bg-muted"} disabled:cursor-not-allowed disabled:opacity-60`}>
                            <div className="flex items-baseline justify-between gap-2">
                                <p className="font-medium">{l.title}</p>
                                {!l.ready ? <span className="text-xs text-muted-foreground">sắp có</span> : st && st.attempts > 0 ? <span className="text-xs tabular-nums text-muted-foreground">{st.attempts} lượt · TB {st.avgOverall ?? "–"}</span> : <span className="text-xs text-muted-foreground">chưa luyện</span>}
                            </div>
                            <p className="mt-0.5 text-sm text-muted-foreground">{l.desc}</p>
                        </button>
                    );
                })}
            </div>

            {summary.data && summary.data.weakSounds.length > 0 && (
                <Card>
                    <CardContent className="p-5">
                        <p className="text-sm font-medium">Âm bạn hay sai</p>
                        <ul className="mt-2 flex flex-wrap gap-2">
                            {summary.data.weakSounds.map((s) => (
                                <li key={s.sound}>
                                    <button type="button" onClick={() => go("word", s.sound)} className={`rounded-md border px-2.5 py-1 text-sm hover:bg-muted ${sound === s.sound ? "border-primary" : ""}`} title={s.tipVi ?? undefined}>
                                        {s.label} <span className="text-muted-foreground">· {MASTERY_VI[s.level] ?? s.level} · {s.correct}/{s.attempts}</span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                        <p className="mt-2 text-xs text-muted-foreground">Chạm một âm để luyện riêng các từ chứa âm đó.</p>
                    </CardContent>
                </Card>
            )}

            {sound && level === "word" && (
                <p className="text-sm">Đang luyện âm <span className="font-medium">{soundTips[sound] ? sound : sound}</span>. <Link href="/speak?level=word" className="underline underline-offset-4">Luyện tất cả các từ</Link></p>
            )}

            {level === "word" && <WordLevel sound={sound} soundTips={soundTips} onSaved={onSaved} />}
            {level === "sentence_build" && <SentenceBuildLevel soundTips={soundTips} onSaved={onSaved} />}
            {level === "sentence" && <SentenceLevel soundTips={soundTips} onSaved={onSaved} />}
            {level === "free" && <FreeLevel onSaved={onSaved} />}
        </div>
    );
}
