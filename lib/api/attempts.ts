import apiClient from '@/lib/api';
import type {
    TestAttempt,
    QuestionAttempt,
    WritingSubmission,
    SpeakingSubmission,
} from '../types';

export const attemptsApi = {
    startAttempt: (learnerId: string, testId: string) =>
        apiClient
            .post<{ data: TestAttempt }>('/api/attempts', { learnerId, testId })
            .then((r) => r.data.data),

    saveAnswer: (attemptId: string, questionId: string, answer: string) =>
        apiClient
            .post<{ data: QuestionAttempt }>(`/api/attempts/${attemptId}/answers`, {
                questionId,
                answer,
            })
            .then((r) => r.data.data),

    submitAttempt: (attemptId: string) =>
        apiClient
            .post<{ data: TestAttempt }>(`/api/attempts/${attemptId}/submit`)
            .then((r) => r.data.data),

    getAttempt: (attemptId: string) =>
        apiClient
            .get<{ data: TestAttempt & { questionAttempts: QuestionAttempt[] } }>(
                `/api/attempts/${attemptId}`,
            )
            .then((r) => r.data.data),

    getAttemptsByLearner: (learnerId: string) =>
        apiClient
            .get<{ data: TestAttempt[] }>(`/api/learners/${learnerId}/attempts`)
            .then((r) => r.data.data)
            .catch(async (error) => {
                // Compatibility fallback: some deployments expose learner attempts
                // through test-service query route instead of submission-service.
                if (error?.response?.status === 404) {
                    const fallback = await apiClient.get<{ data: TestAttempt[] }>(
                        `/api/attempts?learnerId=${learnerId}`,
                    );
                    return fallback.data.data;
                }
                throw error;
            }),

    submitWriting: (learnerId: string, writingTaskId: string, content: string) =>
        apiClient
            .post<{ data: WritingSubmission }>('/api/writing-submissions', {
                learnerId,
                writingTaskId,
                content,
            })
            .then((r) => r.data.data),

    getWritingSubmission: (id: string) =>
        apiClient
            .get<{ data: WritingSubmission }>(`/api/writing-submissions/${id}`)
            .then((r) => r.data.data),

    submitSpeaking: (
        learnerId: string,
        speakingPartId: string,
        audioUrl: string,
        transcript?: string,
    ) =>
        apiClient
            .post<{ data: SpeakingSubmission }>('/api/speaking-submissions', {
                learnerId,
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
