import apiClient from '@/lib/api';
import type {
    Test,
    PaginatedTests,
    Section,
    Question,
    WritingTask,
    SpeakingPart,
    TestAttempt,
} from '../types';

export const testsApi = {
    getTests: (params?: {
        skill?: string;
        isMock?: boolean;
        difficulty?: string;
        status?: string;
        search?: string;
        page?: number;
        limit?: number;
        /** Teacher: only tests I authored */
        mine?: boolean;
        visibility?: 'public' | 'private';
    }) =>
        apiClient
            .get<{ data: PaginatedTests }>('/api/tests', { params })
            .then((r) => r.data.data),

    updateTestVisibility: (id: string, visibility: 'public' | 'private') =>
        apiClient
            .patch<{ data: Test }>(`/api/tests/${id}/visibility`, { visibility })
            .then((r) => r.data.data),

    getTestById: (id: string) =>
        apiClient
            .get<{ data: Test }>(`/api/tests/${id}`)
            .then((r) => r.data.data),

    getSections: (testId: string) =>
        apiClient
            .get<{ data: Section[] }>(`/api/tests/${testId}/sections`)
            .then((r) => r.data.data),

    /**
     * Fetch questions belonging to a specific question group.
     * The backend models questions under groups, not directly under sections.
     */
    getQuestions: (groupId: string) =>
        apiClient
            .get<{ data: Question[] }>(`/api/groups/${groupId}/questions`)
            .then((r) => r.data.data),

    getWritingTasks: (testId: string) =>
        apiClient
            .get<{ data: WritingTask[] }>(`/api/tests/${testId}/writing-tasks`)
            .then((r) => r.data.data),

    getSpeakingParts: (testId: string) =>
        apiClient
            .get<{ data: SpeakingPart[] }>(`/api/tests/${testId}/speaking-parts`)
            .then((r) => r.data.data),

    createTest: (dto: {
        skill: string;
        title: string;
        isMock: boolean;
        createdBy: string;
        difficulty?: string;
        status?: string;
        description?: string;
        durationMinutes?: number;
    }) =>
        apiClient
            .post<{ data: Test }>('/api/tests', dto)
            .then((r) => r.data.data),

    updateTest: (
        id: string,
        dto: Partial<Pick<Test, 'title' | 'skill' | 'isMock' | 'difficulty' | 'status' | 'description' | 'durationMinutes'>>,
    ) =>
        apiClient
            .put<{ data: Test }>(`/api/tests/${id}`, dto)
            .then((r) => r.data.data),

    deleteTest: (id: string) => apiClient.delete(`/api/tests/${id}`),

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
        apiClient
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
        apiClient
            .put<{ data: Section }>(`/api/sections/${sectionId}`, dto)
            .then((r) => r.data.data),

    deleteSection: (sectionId: string) =>
        apiClient.delete(`/api/sections/${sectionId}`),

    // ─── Question Groups ───────────────────────────────────────────────────────

    createGroup: (
        sectionId: string,
        dto: { groupOrder: number; instructions?: string },
    ) =>
        apiClient
            .post<{ data: { id: string; groupOrder: number; instructions: string } }>(
                `/api/sections/${sectionId}/groups`,
                dto,
            )
            .then((r) => r.data.data),

    updateGroup: (
        groupId: string,
        dto: { groupOrder?: number; instructions?: string },
    ) =>
        apiClient
            .put<{ data: { id: string; groupOrder: number; instructions: string } }>(
                `/api/groups/${groupId}`,
                dto,
            )
            .then((r) => r.data.data),

    deleteGroup: (groupId: string) =>
        apiClient.delete(`/api/groups/${groupId}`),

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
        apiClient
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
        apiClient
            .put<{ data: Question }>(`/api/questions/${questionId}`, dto)
            .then((r) => r.data.data),

    deleteQuestion: (questionId: string) =>
        apiClient.delete(`/api/questions/${questionId}`),

    // ─── Writing Tasks ────────────────────────────────────────────────────────

    createWritingTask: (
        testId: string,
        dto: {
            taskNumber: number;
            prompt: string;
            wordLimit: number;
        },
    ) =>
        apiClient
            .post<{ data: WritingTask }>(
                `/api/tests/${testId}/writing-tasks`,
                dto,
            )
            .then((r) => r.data.data),

    deleteWritingTask: (taskId: string) =>
        apiClient.delete(`/api/writing-tasks/${taskId}`),

    // ─── Speaking Parts ───────────────────────────────────────────────────────

    createSpeakingPart: (
        testId: string,
        dto: {
            partNumber: number;
            prompt?: string;
        },
    ) =>
        apiClient
            .post<{ data: SpeakingPart }>(
                `/api/tests/${testId}/speaking-parts`,
                dto,
            )
            .then((r) => r.data.data),

    deleteSpeakingPart: (partId: string) =>
        apiClient.delete(`/api/speaking-parts/${partId}`),

    // ─── Test Attempts ────────────────────────────────────────────────────────
    //
    // The attempt is a server-side exam session: the learner is identified by the
    // JWT (no learnerId in the body), the deadline is `expiresAt`, answers are
    // autosaved to `/draft`, and bands are never sent from the client.

    /** Start (or resume the open) attempt. `durationMinutes` only applies to practice tests. */
    startAttempt: (testId: string, opts?: { durationMinutes?: number; assignmentId?: string }) =>
        apiClient
            .post<{ data: TestAttempt }>(`/api/tests/${testId}/attempts`, opts ?? {})
            .then((r) => r.data.data),

    /** The in-progress attempt of the current learner for a test, or null. */
    getActiveAttempt: (testId: string, assignmentId?: string) =>
        apiClient
            .get<{ data: TestAttempt }>('/api/attempts/active', { params: assignmentId ? { testId, assignmentId } : { testId } })
            .then((r) => r.data.data)
            .catch((err) => {
                if (err?.response?.status === 404) return null;
                throw err;
            }),

    saveDraft: (attemptId: string, answers: Record<string, string>) =>
        apiClient
            .put<{ data: { savedAt: string; remainingSeconds: number | null } }>(
                `/api/attempts/${attemptId}/draft`,
                { answers },
            )
            .then((r) => r.data.data),

    getAttemptById: (attemptId: string) =>
        apiClient
            .get<{ data: TestAttempt }>(`/api/attempts/${attemptId}`)
            .then((r) => r.data.data),

    submitAttempt: (
        attemptId: string,
        dto: { answers: { questionId: string; answer?: string }[] },
    ) =>
        apiClient
            .post<{ data: TestAttempt }>(`/api/attempts/${attemptId}/submit`, dto)
            .then((r) => r.data.data),

    /** Attempts of the signed-in learner (admins may pass another learnerId). */
    getAttemptsByLearnerId: (learnerId?: string) =>
        apiClient
            .get<{ data: TestAttempt[] }>('/api/attempts', { params: learnerId ? { learnerId } : undefined })
            .then((r) => r.data.data),
};
