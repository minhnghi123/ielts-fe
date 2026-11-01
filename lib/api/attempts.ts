import apiClient from '@/lib/api';
import type {
    TestAttempt,
    QuestionAttempt,
    WritingSubmission,
    SpeakingSubmission,
} from '../types';

export const attemptsApi = {
    /** @deprecated use testsApi.startAttempt — identity comes from the token now */
    startAttempt: (_learnerId: string, testId: string) =>
        apiClient
            .post<{ data: TestAttempt }>(`/api/tests/${testId}/attempts`, {})
            .then((r) => r.data.data),

    /** Autosave a single answer by merging it into the attempt draft. */
    saveAnswer: (attemptId: string, questionId: string, answer: string) =>
        apiClient
            .put<{ data: { savedAt: string } }>(`/api/attempts/${attemptId}/draft`, {
                answers: { [questionId]: answer },
            })
            .then((r) => r.data.data as unknown as QuestionAttempt),

    submitAttempt: (attemptId: string) =>
        apiClient
            .post<{ data: TestAttempt }>(`/api/attempts/${attemptId}/submit`, { answers: [] })
            .then((r) => r.data.data),

    getAttempt: (attemptId: string) =>
        apiClient
            .get<{ data: TestAttempt & { questionAttempts: QuestionAttempt[] } }>(
                `/api/attempts/${attemptId}`,
            )
            .then((r) => r.data.data),

    getAttemptsByLearner: (_learnerId: string) =>
        apiClient
            .get<{ data: TestAttempt[] }>('/api/attempts')
            .then((r) => r.data.data),

    submitWriting: (_learnerId: string, writingTaskId: string, content: string) =>
        apiClient
            .post<{ data: WritingSubmission }>('/api/writing-submissions', {
                writingTaskId,
                content,
            })
            .then((r) => r.data.data),

    getWritingGrading: (gradingId: string) =>
        apiClient
            .get<{ data: Record<string, unknown> }>(`/api/writing-gradings/${gradingId}`)
            .then((r) => r.data.data),

    getWritingGradingBySubmission: (submissionId: string) =>
        apiClient
            .get<{ data: Record<string, unknown> | null }>(`/api/writing-gradings/by-submission/${submissionId}`)
            .then((r) => r.data.data),

    getWritingSubmissionsByLearner: (learnerId: string) =>
        apiClient
            .get<{ data: WritingSubmission[] }>(`/api/learners/${learnerId}/writing-submissions`)
            .then((r) => r.data.data),

    getWritingSubmission: (id: string) =>
        apiClient
            .get<{ data: WritingSubmission }>(`/api/writing-submissions/${id}`)
            .then((r) => r.data.data),

    submitSpeaking: (
        _learnerId: string,
        speakingPartId: string,
        audioUrl: string,
        transcript?: string,
    ) =>
        apiClient
            .post<{ data: SpeakingSubmission }>('/api/speaking-submissions', {
                speakingPartId,
                audioUrl,
                transcript,
            })
            .then((r) => r.data.data),

    getSpeakingSubmission: (id: string) =>
        apiClient
            .get<{ data: SpeakingSubmission }>(`/api/speaking-submissions/${id}`)
            .then((r) => r.data.data),
};
