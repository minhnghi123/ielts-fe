import axios from 'axios';
import type {
    TestAttempt,
    QuestionAttempt,
    WritingSubmission,
    SpeakingSubmission,
} from '../types';

const BASE_URL =
    process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const submissionAxios = axios.create({
    baseURL: BASE_URL,
    timeout: 15000,
    headers: { 'Content-Type': 'application/json' },
});

submissionAxios.interceptors.request.use((config) => {
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

export const attemptsApi = {
    startAttempt: (learnerId: string, testId: string) =>
        submissionAxios
            .post<{ data: TestAttempt }>('/api/attempts', { learnerId, testId })
            .then((r) => r.data.data),

    saveAnswer: (attemptId: string, questionId: string, answer: string) =>
        submissionAxios
            .post<{ data: QuestionAttempt }>(`/api/attempts/${attemptId}/answers`, {
                questionId,
                answer,
            })
            .then((r) => r.data.data),

    submitAttempt: (attemptId: string) =>
        submissionAxios
            .post<{ data: TestAttempt }>(`/api/attempts/${attemptId}/submit`)
            .then((r) => r.data.data),

    getAttempt: (attemptId: string) =>
        submissionAxios
            .get<{ data: TestAttempt & { questionAttempts: QuestionAttempt[] } }>(
                `/api/attempts/${attemptId}`,
            )
            .then((r) => r.data.data),

    getAttemptsByLearner: (learnerId: string) =>
        submissionAxios
            .get<{ data: TestAttempt[] }>(`/api/learners/${learnerId}/attempts`)
            .then((r) => r.data.data),

    submitWriting: (learnerId: string, writingTaskId: string, content: string) =>
        submissionAxios
            .post<{ data: WritingSubmission }>('/api/writing-submissions', {
                learnerId,
                writingTaskId,
                content,
            })
            .then((r) => r.data.data),

    getWritingSubmission: (id: string) =>
        submissionAxios
            .get<{ data: WritingSubmission }>(`/api/writing-submissions/${id}`)
            .then((r) => r.data.data),

    submitSpeaking: (
        learnerId: string,
        speakingPartId: string,
        audioUrl: string,
        transcript?: string,
    ) =>
        submissionAxios
            .post<{ data: SpeakingSubmission }>('/api/speaking-submissions', {
                learnerId,
                speakingPartId,
                audioUrl,
                transcript,
            })
            .then((r) => r.data.data),

    getSpeakingSubmission: (id: string) =>
        submissionAxios
            .get<{ data: SpeakingSubmission }>(`/api/speaking-submissions/${id}`)
            .then((r) => r.data.data),
};
