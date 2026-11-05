"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { memoryApi } from "@/lib/api/memory";

/** "Ôn trước khi quên": what the forgetting model predicts you are about to lose — with the number, so the nudge is honest. */
export function MemoryNudge({ learnerId }: { learnerId?: string }) {
    const q = useQuery({ queryKey: ["memory-forecast", learnerId], queryFn: () => memoryApi.forecast(learnerId!), enabled: !!learnerId, staleTime: 60_000 });
    const d = q.data;
    if (!d || (d.counts.atRiskWords === 0 && d.counts.atRiskMistakes === 0)) return null;
    const weakest = d.items[0];
    return (
        <div className="rounded-lg border border-amber-200 bg-amber-50/60 px-4 py-3 text-sm flex flex-wrap items-center gap-x-4 gap-y-1">
            <p className="font-medium">Ôn trước khi quên</p>
            <p className="text-muted-foreground">
                Mô hình dự đoán bạn sắp quên {d.counts.atRiskWords > 0 ? `${d.counts.atRiskWords} từ` : ""}{d.counts.atRiskWords > 0 && d.counts.atRiskMistakes > 0 ? " và " : ""}{d.counts.atRiskMistakes > 0 ? `${d.counts.atRiskMistakes} câu trong sổ lỗi` : ""}
                {weakest ? ` — yếu nhất: “${weakest.label ?? weakest.questionType ?? "câu hỏi"}” (nhớ ~${Math.round(weakest.pRecall * 100)}%)` : ""}.
            </p>
            <span className="ml-auto flex gap-3">
                {d.counts.atRiskWords > 0 && <Link href="/words" className="text-primary underline-offset-4 hover:underline">Ôn từ</Link>}
                {d.counts.atRiskMistakes > 0 && <Link href="/mistakes?due=1" className="text-primary underline-offset-4 hover:underline">Ôn sổ lỗi</Link>}
            </span>
        </div>
    );
}
