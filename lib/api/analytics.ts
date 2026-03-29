import axios from 'axios';
import type {
    LearnerBandProfile,
    LearnerProgressSnapshot,
    LearnerMistake,
    DashboardSummary,
    AdminGlobalStats,
    ApiResponse,
} from '../types';

const BASE_URL =
    process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const analyticsAxios = axios.create({
    baseURL: BASE_URL,
    timeout: 30_000,
    headers: { 'Content-Type': 'application/json' },
});

analyticsAxios.interceptors.request.use((config) => {
    if (typeof document !== 'undefined') {
        const cookies = document.cookie.split(';').reduce(
            (acc, c) => {
                const [k, v] = c.trim().split('=');
                acc[k] = v;
                return acc;
            },
            {} as Record<string, string>,
        );
        const token = cookies['accessToken'];
        if (token) config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

/**
 * The analytics-service uses a TransformInterceptor which wraps its controller responses
 * in an outer { data, statusCode, message } object. The proxy-service forwards this raw
 * body exactly, so the frontend must access response.data.data to get the actual payload.
 */
export const analyticsApi = {
    getDashboardSummary: (learnerId: string) =>
        analyticsAxios
            .get<ApiResponse<DashboardSummary>>(`/api/analytics/summary/${learnerId}`)
            .then((r) => r.data.data),

    getBandProfiles: (learnerId: string) =>
        analyticsAxios
            .get<ApiResponse<LearnerBandProfile[]>>(`/api/analytics/band-profiles/${learnerId}`)
            .then((r) => r.data.data),

    upsertBandProfile: (dto: {
        learnerId: string;
        skill: string;
        currentBand?: number;
        targetBand?: number;
    }) =>
        analyticsAxios
            .put<ApiResponse<LearnerBandProfile>>('/api/analytics/band-profiles', dto)
            .then((r) => r.data.data),

    getProgress: (learnerId: string) =>
        analyticsAxios
            .get<ApiResponse<LearnerProgressSnapshot[]>>(`/api/analytics/progress/${learnerId}`)
            .then((r) => r.data.data),

    createSnapshot: (learnerId: string, overallBand: number) =>
        analyticsAxios
            .post<ApiResponse<LearnerProgressSnapshot>>('/api/analytics/progress/snapshot', {
                learnerId,
                overallBand,
            })
            .then((r) => r.data.data),

    getMistakes: (learnerId: string) =>
        analyticsAxios
            .get<ApiResponse<LearnerMistake[]>>(`/api/analytics/mistakes/${learnerId}`)
            .then((r) => r.data.data),

    syncLearner: (learnerId: string) =>
        analyticsAxios
            .post<ApiResponse<{ bandProfiles: number; snapshots: number; mistakes: number }>>(
                `/api/analytics/sync/${learnerId}`,
            )
            .then((r) => r.data.data),

    syncAll: () =>
        analyticsAxios
            .post<ApiResponse<{ synced: number }>>('/api/analytics/sync-all')
            .then((r) => r.data.data),

    getAdminGlobalStats: () =>
        analyticsAxios
            .get<ApiResponse<AdminGlobalStats>>('/api/analytics/admin/global-stats')
            .then((r) => r.data.data),
};
