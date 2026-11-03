"use client";

import { useQuery } from "@tanstack/react-query";
import { MASTERY_LABELS_VI, wordsApi } from "@/lib/api/words";
import { QUESTION_TYPE_LABELS_VI, normalizeQuestionType } from "@/lib/question-types";

const LEVEL_CLASS: Record<string, string> = {
    chua_du_du_lieu: "bg-muted text-muted-foreground",
    yeu: "bg-rose-50 text-rose-700",
    dang_hoc: "bg-amber-50 text-amber-700",
    vung: "bg-emerald-50 text-emerald-700",
    thanh_thao: "bg-primary/10 text-primary",
};

/** Mức thành thạo theo dạng câu (Elo), yếu nhất trước — để học viên biết nên luyện gì. */
export function MasteryList({ learnerId }: { learnerId?: string }) {
    const { data } = useQuery({ queryKey: ["mastery", learnerId], queryFn: () => wordsApi.mastery(learnerId!), enabled: !!learnerId, staleTime: 60_000 });
    if (!data || data.length === 0) return null;
    return (
        <div className="mt-2 flex flex-wrap gap-1.5" aria-label="Mức thành thạo theo dạng câu">
            {data.slice(0, 8).map((m) => {
                const t = normalizeQuestionType(m.kc);
                return (
                    <span key={`${m.skill}-${m.kc}`} className={`rounded-full px-2.5 py-0.5 text-xs ${LEVEL_CLASS[m.level]}`} title={`${m.correct}/${m.attempts} đúng · rating ${Math.round(m.rating)}`}>
                        {t ? QUESTION_TYPE_LABELS_VI[t] : m.kc} ({m.skill === "listening" ? "L" : "R"}) · {MASTERY_LABELS_VI[m.level]}
                    </span>
                );
            })}
        </div>
    );
}
