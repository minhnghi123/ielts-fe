import apiClient from '@/lib/api';
import type { ApiResponse } from '@/lib/types';

export type MasteryLevel = 'chua_du_du_lieu' | 'yeu' | 'dang_hoc' | 'vung' | 'thanh_thao';
export interface KcState { kc: string; rating: number; attempts: number; correct: number; accuracy: number | null; level: MasteryLevel; updatedAt: string }
export interface SkillModel { skill: 'listening' | 'reading' | 'writing' | 'speaking'; estimate: { low: number; high: number; mid: number } | null; answered: number; kcs: KcState[] }
export interface LearnerModel {
    skills: SkillModel[];
    sounds: Array<{ sound: string; rating: number; attempts: number; correct: number; level: MasteryLevel }>;
    words: { due: number; soon: number; total: number };
    topErrorCauses: Array<{ cause: string; n: number }>;
    feedback: Array<{ skill: string; kc: string; verdict: 'vung' | 'chua_vung'; at: string }>;
    method: { bandScale: string; minAnswers: number };
}

const base = '/api/analytics/learner-model';
export const learnerModelApi = {
    get: (learnerId: string) => apiClient.get<ApiResponse<LearnerModel>>(`${base}/${learnerId}`).then((r) => r.data.data),
    feedback: (learnerId: string, input: { skill: string; kc: string; verdict: 'vung' | 'chua_vung' }) =>
        apiClient.post<ApiResponse<{ kc: string; ratingBefore: number; ratingAfter: number; level: MasteryLevel }>>(`${base}/${learnerId}/kc-feedback`, input).then((r) => r.data.data),
};
