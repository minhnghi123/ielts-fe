import apiClient from '@/lib/api';
import type { ApiResponse } from '@/lib/types';

export interface SavedWord {
    id: string;
    learnerId: string;
    word: string;
    context: string | null;
    meaningVi: string | null;
    testId: string | null;
    srsIntervalDays: number;
    srsEase: number;
    nextReviewAt: string | null;
    reviewCount: number;
    correctCount?: number;
    lapseCount?: number;
    halfLifeH?: number | null;
    lastReviewedAt?: string | null;
    createdAt: string;
    /** Only on the review response: predicted recall before this review. */
    pRecallBefore?: number;
}

export type MasteryLevel = 'chua_du_du_lieu' | 'yeu' | 'dang_hoc' | 'vung' | 'thanh_thao';
export interface KcMastery {
    skill: string;
    kc: string;
    rating: number;
    attempts: number;
    correct: number;
    accuracy: number | null;
    level: MasteryLevel;
}
export const MASTERY_LABELS_VI: Record<MasteryLevel, string> = {
    chua_du_du_lieu: 'Chưa đủ dữ liệu',
    yeu: 'Yếu',
    dang_hoc: 'Đang học',
    vung: 'Vững',
    thanh_thao: 'Thành thạo',
};

export const wordsApi = {
    list: (due = false) =>
        apiClient.get<ApiResponse<SavedWord[]>>('/api/analytics/words', { params: due ? { due: 1 } : {} }).then((r) => r.data.data),
    add: (input: { word: string; context?: string; meaningVi?: string; testId?: string }) =>
        apiClient.post<ApiResponse<SavedWord>>('/api/analytics/words', input).then((r) => r.data.data),
    update: (id: string, patch: { meaningVi?: string; context?: string }) =>
        apiClient.patch<ApiResponse<SavedWord>>(`/api/analytics/words/${id}`, patch).then((r) => r.data.data),
    remove: (id: string) => apiClient.delete<ApiResponse<{ deleted: boolean }>>(`/api/analytics/words/${id}`).then((r) => r.data.data),
    review: (id: string, quality: 'again' | 'good' | 'easy') =>
        apiClient.post<ApiResponse<SavedWord>>(`/api/analytics/words/${id}/review`, { quality }).then((r) => r.data.data),
    mastery: (learnerId: string, skill?: string) =>
        apiClient.get<ApiResponse<KcMastery[]>>(`/api/analytics/mastery/${learnerId}`, { params: skill ? { skill } : {} }).then((r) => r.data.data),
};
