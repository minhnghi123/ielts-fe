import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { attemptsApi } from '@/lib/api/attempts';
import { queryKeys } from '@/lib/query-keys';

// ─── Queries ──────────────────────────────────────────────────────────────────

/**
 * Fetch all attempts for a learner (via submission-service with 404 fallback).
 */
export function useAttemptsByLearner(learnerId: string | undefined) {
    return useQuery({
        queryKey: queryKeys.attempts.byLearner(learnerId ?? ''),
        queryFn: () => attemptsApi.getAttemptsByLearner(learnerId!),
        enabled: !!learnerId,
        staleTime: 30_000,
    });
}

/** Fetch a single attempt with its question attempts. */
export function useAttemptDetail(attemptId: string | undefined) {
    return useQuery({
        queryKey: queryKeys.attempts.detail(attemptId ?? ''),
        queryFn: () => attemptsApi.getAttempt(attemptId!),
        enabled: !!attemptId,
        staleTime: 60_000,
    });
}

/** Fetch a writing submission by ID. */
export function useWritingSubmission(id: string | undefined) {
    return useQuery({
        queryKey: queryKeys.submissions.writing(id ?? ''),
        queryFn: () => attemptsApi.getWritingSubmission(id!),
        enabled: !!id,
        staleTime: 60_000,
    });
}

/** Fetch a speaking submission by ID. */
export function useSpeakingSubmission(id: string | undefined) {
    return useQuery({
        queryKey: queryKeys.submissions.speaking(id ?? ''),
        queryFn: () => attemptsApi.getSpeakingSubmission(id!),
        enabled: !!id,
        staleTime: 60_000,
    });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

/** Start a new test attempt. */
export function useStartAttempt() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ learnerId, testId }: { learnerId: string; testId: string }) =>
            attemptsApi.startAttempt(learnerId, testId),
        onSuccess: (_data, { learnerId }) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.attempts.byLearner(learnerId) });
        },
    });
}

/** Save a single question answer during a test session. */
export function useSaveAnswer() {
    return useMutation({
        mutationFn: ({
            attemptId,
            questionId,
            answer,
        }: {
            attemptId: string;
            questionId: string;
            answer: string;
        }) => attemptsApi.saveAnswer(attemptId, questionId, answer),
    });
}

/** Submit a test attempt (finalize). */
export function useSubmitAttempt() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (attemptId: string) => attemptsApi.submitAttempt(attemptId),
        onSuccess: (_data, attemptId) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.attempts.detail(attemptId) });
            queryClient.invalidateQueries({ queryKey: queryKeys.attempts.all });
        },
    });
}

/** Submit a writing task response for AI grading. */
export function useSubmitWriting() {
    return useMutation({
        mutationFn: ({
            learnerId,
            writingTaskId,
            content,
        }: {
            learnerId: string;
            writingTaskId: string;
            content: string;
        }) => attemptsApi.submitWriting(learnerId, writingTaskId, content),
    });
}

/** Submit a speaking part recording for AI grading. */
export function useSubmitSpeaking() {
    return useMutation({
        mutationFn: ({
            learnerId,
            speakingPartId,
            audioUrl,
            transcript,
        }: {
            learnerId: string;
            speakingPartId: string;
            audioUrl: string;
            transcript?: string;
        }) => attemptsApi.submitSpeaking(learnerId, speakingPartId, audioUrl, transcript),
    });
}
