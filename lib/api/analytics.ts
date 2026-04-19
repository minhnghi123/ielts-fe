import apiClient from '@/lib/api';
import type {
    LearnerBandProfile,
    LearnerProgressSnapshot,
    LearnerMistake,
    DashboardSummary,
    AdminGlobalStats,
    ApiResponse,
} from '../types';

/**
 * The analytics-service uses a TransformInterceptor which wraps its controller responses
 * in an outer { data, statusCode, message } object. The proxy-service forwards this raw
 * body exactly, so the frontend must access response.data.data to get the actual payload.
 */
export const analyticsApi = {
    getDashboardSummary: (learnerId: string) =>
        apiClient
            .get<ApiResponse<DashboardSummary>>(`/api/analytics/summary/${learnerId}`)
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

    getMistakes: (learnerId: string) =>
        apiClient
            .get<ApiResponse<LearnerMistake[]>>(`/api/analytics/mistakes/${learnerId}`)
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

    getAdminGlobalStats: () =>
        apiClient
            .get<ApiResponse<AdminGlobalStats>>('/api/analytics/admin/global-stats')
            .then((r) => r.data.data),
};
