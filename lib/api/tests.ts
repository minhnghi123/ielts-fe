import axios from 'axios';
import type {
    Test,
    PaginatedTests,
    Section,
    Question,
    WritingTask,
    SpeakingPart,
} from '../types';

const BASE_URL =
    process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const testAxios = axios.create({
    baseURL: BASE_URL,
    timeout: 15000,
    headers: { 'Content-Type': 'application/json' },
});

testAxios.interceptors.request.use((config) => {
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

export const testsApi = {
    getTests: (params?: {
        skill?: string;
        isMock?: boolean;
        page?: number;
        limit?: number;
    }) =>
        testAxios
            .get<{ data: PaginatedTests }>('/api/tests', { params })
            .then((r) => r.data.data),

    getTestById: (id: string) =>
        testAxios
            .get<{ data: Test }>(`/api/tests/${id}`)
            .then((r) => r.data.data),

    getSections: (testId: string) =>
        testAxios
            .get<{ data: Section[] }>(`/api/tests/${testId}/sections`)
            .then((r) => r.data.data),

    getQuestions: (sectionId: string) =>
        testAxios
            .get<{ data: Question[] }>(`/api/sections/${sectionId}/questions`)
            .then((r) => r.data.data),

    getWritingTasks: (testId: string) =>
        testAxios
            .get<{ data: WritingTask[] }>(`/api/tests/${testId}/writing-tasks`)
            .then((r) => r.data.data),

    getSpeakingParts: (testId: string) =>
        testAxios
            .get<{ data: SpeakingPart[] }>(`/api/tests/${testId}/speaking-parts`)
            .then((r) => r.data.data),

    createTest: (dto: {
        skill: string;
        title: string;
        isMock: boolean;
        createdBy: string;
    }) =>
        testAxios
            .post<{ data: Test }>('/api/tests', dto)
            .then((r) => r.data.data),

    deleteTest: (id: string) => testAxios.delete(`/api/tests/${id}`),
};
