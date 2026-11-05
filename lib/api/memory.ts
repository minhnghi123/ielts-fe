import apiClient from '@/lib/api';
import type { ApiResponse } from '@/lib/types';

export interface MemoryItem {
    type: 'word' | 'mistake';
    id: string;
    label?: string;
    meaningVi?: string | null;
    questionId?: string;
    skill?: string | null;
    questionType?: string | null;
    h: number;
    pRecall: number;
    nextReviewAt: string | null;
}
export interface MemoryForecast {
    items: MemoryItem[];
    counts: { words: number; mistakes: number; atRiskWords: number; atRiskMistakes: number };
    model: { scale: number; nObs: number; logLoss: number | null; fittedAt: string | null; minObs: number };
}

export const memoryApi = {
    forecast: (learnerId: string) => apiClient.get<ApiResponse<MemoryForecast>>(`/api/analytics/memory/${learnerId}/forecast`).then((r) => r.data.data),
    refit: (learnerId: string) => apiClient.post<ApiResponse<{ scale: number; nObs: number; logLoss: number } | null>>(`/api/analytics/memory/${learnerId}/refit`).then((r) => r.data.data),
};

/** Human-friendly half-life: "~3 ngày" / "~18 giờ". */
export function halfLifeLabel(h: number): string {
    if (h < 48) return `~${Math.round(h)} giờ`;
    return `~${Math.round(h / 24)} ngày`;
}
