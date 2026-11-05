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
    model: { scale: number; nObs: number; fittedOn: number; logLoss: number | null; fittedAt: string | null; minObs: number };
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

/** Client-side recall estimate for an item (same formula as the BE): 2^(-lag/h). */
export function recallNow(item: { halfLifeH?: number | null; lastReviewedAt?: string | null; createdAt: string }, now = Date.now()): number | null {
    const h = item.halfLifeH ?? 24;
    const anchor = item.lastReviewedAt ?? item.createdAt;
    if (!anchor) return null;
    const lagH = Math.max(0, (now - new Date(anchor).getTime()) / 3_600_000);
    return Math.pow(2, -lagH / h);
}
export const AT_RISK_P = 0.7;
