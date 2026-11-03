import type { MistakeSummary, MistakeStatus, QuestionExplanation } from '@/lib/types';
import apiClient from '@/lib/api';
import type {
    LearnerBandProfile,
    LearnerProgressSnapshot,
    LearnerMistake,
    DashboardSummary,
    AdminGlobalStats,
    LeaderboardEntry,
    LearnerGoals,
    LearnerGoalsInput,
    ApiResponse,
} from '../types';

/**
 * The analytics-service uses a TransformInterceptor which wraps its controller responses
 * in an outer { data, statusCode, message } object. The proxy-service forwards this raw
 * body exactly, so the frontend must access response.data.data to get the actual payload.
 */
export interface MistakeFilters {
    status?: MistakeStatus;
    skill?: string;
    questionType?: string;
    attemptId?: string;
    due?: boolean;
}

export const analyticsApi = {
    getDashboardSummary: (learnerId: string) =>
        apiClient
            .get<ApiResponse<DashboardSummary>>(`/api/analytics/summary/${learnerId}`)
            .then((r) => r.data.data),

    getGoals: (learnerId: string) =>
        apiClient
            .get<ApiResponse<LearnerGoals | null>>(`/api/analytics/goals/${learnerId}`)
            .then((r) => r.data.data ?? null),

    upsertGoals: (learnerId: string, dto: LearnerGoalsInput) =>
        apiClient
            .put<ApiResponse<LearnerGoals>>(`/api/analytics/goals/${learnerId}`, dto)
            .then((r) => r.data.data),

    getBandProfiles: (learnerId: string) =>
        apiClient
            .get<ApiResponse<LearnerBandProfile[]>>(`/api/analytics/band-profiles/${learnerId}`)
            .then((r) => r.data.data),

    upsertBandProfile: (dto: {
        learnerId: string;
        skill: string;
        currentBand?: number;
        targetBand?: number;
    }) =>
        apiClient
            .put<ApiResponse<LearnerBandProfile>>('/api/analytics/band-profiles', dto)
            .then((r) => r.data.data),

    getProgress: (learnerId: string) =>
        apiClient
            .get<ApiResponse<LearnerProgressSnapshot[]>>(`/api/analytics/progress/${learnerId}`)
            .then((r) => r.data.data),

    createSnapshot: (learnerId: string, overallBand: number) =>
        apiClient
            .post<ApiResponse<LearnerProgressSnapshot>>('/api/analytics/progress/snapshot', {
                learnerId,
                overallBand,
            })
            .then((r) => r.data.data),

    getMistakes: (learnerId: string, filters: MistakeFilters = {}) =>
        apiClient
            .get<ApiResponse<LearnerMistake[]>>(`/api/analytics/mistakes/${learnerId}`, {
                params: { ...filters, due: filters.due ? 1 : undefined },
            })
            .then((r) => r.data.data),

    getMistakeSummary: (learnerId: string, attemptId?: string) =>
        apiClient
            .get<ApiResponse<MistakeSummary>>(`/api/analytics/mistakes/${learnerId}/summary`, {
                params: attemptId ? { attemptId } : undefined,
            })
            .then((r) => r.data.data),

    updateMistakeStatus: (id: string, status: MistakeStatus) =>
        apiClient
            .patch<ApiResponse<LearnerMistake>>(`/api/analytics/mistakes/${id}/status`, { status })
            .then((r) => r.data.data),

    getExplanation: (questionId: string, userAnswer?: string) =>
        apiClient
            .get<ApiResponse<QuestionExplanation | null>>('/api/analytics/explanations', {
                params: { questionId, userAnswer },
            })
            .then((r) => r.data.data),

    voteExplanation: (id: string, helpful: boolean) =>
        apiClient
            .post<ApiResponse<QuestionExplanation>>(`/api/analytics/explanations/${id}/vote`, { helpful })
            .then((r) => r.data.data),

    syncLearner: (learnerId: string) =>
        apiClient
            .post<ApiResponse<{ bandProfiles: number; snapshots: number; mistakes: number }>>(
                `/api/analytics/sync/${learnerId}`,
            )
            .then((r) => r.data.data),

    syncAll: () =>
        apiClient
            .post<ApiResponse<{ synced: number }>>('/api/analytics/sync-all')
            .then((r) => r.data.data),

    getLeaderboard: (limit = 50) =>
        apiClient
            .get<ApiResponse<LeaderboardEntry[]>>('/api/analytics/leaderboard', { params: { limit } })
            .then((r) => r.data.data),

    getAdminGlobalStats: () =>
        apiClient
            .get<ApiResponse<AdminGlobalStats>>('/api/analytics/admin/global-stats')
            .then((r) => r.data.data),
};
