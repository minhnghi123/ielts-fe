import axios from 'axios';
import type {
    LearnerBandProfile,
    LearnerProgressSnapshot,
    LearnerMistake,
    DashboardSummary,
} from '../types';

const BASE_URL =
    process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const analyticsAxios = axios.create({
    baseURL: BASE_URL,
    timeout: 15000,
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

export const analyticsApi = {
    getDashboardSummary: (learnerId: string) =>
        analyticsAxios
            .get<{ data: DashboardSummary }>(`/api/analytics/summary/${learnerId}`)
            .then((r) => r.data.data),

    getBandProfiles: (learnerId: string) =>
        analyticsAxios
            .get<{ data: LearnerBandProfile[] }>(
                `/api/analytics/band-profiles/${learnerId}`,
            )
            .then((r) => r.data.data),

    upsertBandProfile: (dto: {
        learnerId: string;
        skill: string;
        currentBand?: number;
        targetBand?: number;
    }) =>
        analyticsAxios
            .put<{ data: LearnerBandProfile }>('/api/analytics/band-profiles', dto)
            .then((r) => r.data.data),

    getProgress: (learnerId: string) =>
        analyticsAxios
            .get<{ data: LearnerProgressSnapshot[] }>(
                `/api/analytics/progress/${learnerId}`,
            )
            .then((r) => r.data.data),

    createSnapshot: (learnerId: string, overallBand: number) =>
        analyticsAxios
            .post<{ data: LearnerProgressSnapshot }>(
                '/api/analytics/progress/snapshot',
                { learnerId, overallBand },
            )
            .then((r) => r.data.data),

    getMistakes: (learnerId: string) =>
        analyticsAxios
            .get<{ data: LearnerMistake[] }>(`/api/analytics/mistakes/${learnerId}`)
            .then((r) => r.data.data),
};
