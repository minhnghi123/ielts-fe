import axios from 'axios';
import type {
    Test,
    PaginatedTests,
    Section,
    Question,
    WritingTask,
    SpeakingPart,
    TestAttempt,
    QuestionAttempt,
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

    /**
     * Fetch questions belonging to a specific question group.
     * The backend models questions under groups, not directly under sections.
     */
    getQuestions: (groupId: string) =>
        testAxios
            .get<{ data: Question[] }>(`/api/groups/${groupId}/questions`)
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

    updateTest: (
        id: string,
        dto: Partial<Pick<Test, 'title' | 'skill' | 'isMock'>>,
    ) =>
        testAxios
            .put<{ data: Test }>(`/api/tests/${id}`, dto)
            .then((r) => r.data.data),

    deleteTest: (id: string) => testAxios.delete(`/api/tests/${id}`),

    // ─── Sections ─────────────────────────────────────────────────────────────

    createSection: (
        testId: string,
        dto: {
            sectionOrder: number;
            passage?: string;
            audioUrl?: string;
            timeLimit?: number;
        },
    ) =>
        testAxios
            .post<{ data: Section }>(`/api/tests/${testId}/sections`, dto)
            .then((r) => r.data.data),

    updateSection: (
        sectionId: string,
        dto: {
            sectionOrder?: number;
            passage?: string;
            audioUrl?: string;
            timeLimit?: number;
        },
    ) =>
        testAxios
            .put<{ data: Section }>(`/api/sections/${sectionId}`, dto)
            .then((r) => r.data.data),

    deleteSection: (sectionId: string) =>
        testAxios.delete(`/api/sections/${sectionId}`),

    // ─── Question Groups ───────────────────────────────────────────────────────

    createGroup: (
        sectionId: string,
        dto: { groupOrder: number; instructions?: string },
    ) =>
        testAxios
            .post<{ data: { id: string; groupOrder: number; instructions: string } }>(
                `/api/sections/${sectionId}/groups`,
                dto,
            )
            .then((r) => r.data.data),

    updateGroup: (
        groupId: string,
        dto: { groupOrder?: number; instructions?: string },
    ) =>
        testAxios
            .put<{ data: { id: string; groupOrder: number; instructions: string } }>(
                `/api/groups/${groupId}`,
                dto,
            )
            .then((r) => r.data.data),

    deleteGroup: (groupId: string) =>
        testAxios.delete(`/api/groups/${groupId}`),

    // ─── Questions ────────────────────────────────────────────────────────────

    createQuestion: (
        groupId: string,
        dto: {
            questionOrder: number;
            questionType: string;
            questionText?: string;
            config: Record<string, unknown>;
            explanation?: string;
            answer: {
                correctAnswers: string[];
                caseSensitive: boolean;
            };
        },
    ) =>
        testAxios
            .post<{ data: Question }>(`/api/groups/${groupId}/questions`, dto)
            .then((r) => r.data.data),

    updateQuestion: (
        questionId: string,
        dto: {
            questionOrder?: number;
            questionType?: string;
            questionText?: string;
            config?: Record<string, unknown>;
            explanation?: string | null;
            answer?: {
                correctAnswers: string[];
                caseSensitive: boolean;
            };
        },
    ) =>
        testAxios
            .put<{ data: Question }>(`/api/questions/${questionId}`, dto)
            .then((r) => r.data.data),

    deleteQuestion: (questionId: string) =>
        testAxios.delete(`/api/questions/${questionId}`),

    // ─── Writing Tasks ────────────────────────────────────────────────────────

    createWritingTask: (
        testId: string,
        dto: {
            taskNumber: number;
            prompt: string;
            wordLimit: number;
        },
    ) =>
        testAxios
            .post<{ data: WritingTask }>(
                `/api/tests/${testId}/writing-tasks`,
                dto,
            )
            .then((r) => r.data.data),

    deleteWritingTask: (taskId: string) =>
        testAxios.delete(`/api/writing-tasks/${taskId}`),

    // ─── Speaking Parts ───────────────────────────────────────────────────────

    createSpeakingPart: (
        testId: string,
        dto: {
            partNumber: number;
            prompt?: string;
        },
    ) =>
        testAxios
            .post<{ data: SpeakingPart }>(
                `/api/tests/${testId}/speaking-parts`,
                dto,
            )
            .then((r) => r.data.data),

    deleteSpeakingPart: (partId: string) =>
        testAxios.delete(`/api/speaking-parts/${partId}`),

    // ─── Test Attempts ────────────────────────────────────────────────────────

    startAttempt: (testId: string, learnerId: string) =>
        testAxios
            .post<{ data: TestAttempt }>(`/api/tests/${testId}/attempts`, { learnerId })
            .then((r) => r.data.data),

    getAttemptById: (attemptId: string) =>
        testAxios
            .get<{ data: TestAttempt }>(`/api/attempts/${attemptId}`)
            .then((r) => r.data.data),

    submitAttempt: (
        attemptId: string,
        dto: { answers: { questionId: string; answer?: string }[] }
    ) =>
        testAxios
            .post<{ data: TestAttempt }>(`/api/attempts/${attemptId}/submit`, dto)
            .then((r) => r.data.data),

    getAttemptsByLearnerId: (learnerId: string) =>
        testAxios
            .get<{ data: TestAttempt[] }>(`/api/attempts?learnerId=${learnerId}`)
            .then((r) => r.data.data),

    /** Persist AI-generated feedback text back to the test_attempt row. */
    saveAiFeedback: (attemptId: string, aiFeedback: string) =>
        testAxios.put(`/api/attempts/${attemptId}/ai-feedback`, { aiFeedback }),
};
