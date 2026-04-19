import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { testsApi } from '@/lib/api/tests';
import { queryKeys } from '@/lib/query-keys';
import type { Test } from '@/lib/types';

// ─── Queries ──────────────────────────────────────────────────────────────────

/** Paginated/filtered test list. */
export function useTests(params?: {
    skill?: string;
    isMock?: boolean;
    page?: number;
    limit?: number;
}) {
    return useQuery({
        queryKey: queryKeys.tests.list(params),
        queryFn: () => testsApi.getTests(params),
        staleTime: 30_000,
    });
}

/** Single test detail by ID. */
export function useTestById(id: string | undefined) {
    return useQuery({
        queryKey: queryKeys.tests.detail(id ?? ''),
        queryFn: () => testsApi.getTestById(id!),
        enabled: !!id,
        staleTime: 60_000,
    });
}

/** Sections for a test. */
export function useTestSections(testId: string | undefined) {
    return useQuery({
        queryKey: queryKeys.tests.sections(testId ?? ''),
        queryFn: () => testsApi.getSections(testId!),
        enabled: !!testId,
        staleTime: 60_000,
    });
}

/** Writing tasks for a test. */
export function useWritingTasks(testId: string | undefined) {
    return useQuery({
        queryKey: queryKeys.tests.writingTasks(testId ?? ''),
        queryFn: () => testsApi.getWritingTasks(testId!),
        enabled: !!testId,
        staleTime: 60_000,
    });
}

/** Speaking parts for a test. */
export function useSpeakingParts(testId: string | undefined) {
    return useQuery({
        queryKey: queryKeys.tests.speakingParts(testId ?? ''),
        queryFn: () => testsApi.getSpeakingParts(testId!),
        enabled: !!testId,
        staleTime: 60_000,
    });
}

/** Questions for a question group. */
export function useGroupQuestions(groupId: string | undefined) {
    return useQuery({
        queryKey: queryKeys.tests.questions(groupId ?? ''),
        queryFn: () => testsApi.getQuestions(groupId!),
        enabled: !!groupId,
        staleTime: 60_000,
    });
}

/** Attempts list for a learner (via tests-service). */
export function useAttemptsByLearnerId(learnerId: string | undefined) {
    return useQuery({
        queryKey: queryKeys.attempts.byLearner(learnerId ?? ''),
        queryFn: () => testsApi.getAttemptsByLearnerId(learnerId!),
        enabled: !!learnerId,
        staleTime: 30_000,
    });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

/** Create a new test — invalidates test list cache. */
export function useCreateTest() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (dto: {
            skill: string;
            title: string;
            isMock: boolean;
            createdBy: string;
        }) => testsApi.createTest(dto),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.tests.lists() });
        },
    });
}

/** Update a test — invalidates list + specific detail. */
export function useUpdateTest() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, dto }: { id: string; dto: Partial<Pick<Test, 'title' | 'skill' | 'isMock'>> }) =>
            testsApi.updateTest(id, dto),
        onSuccess: (_data, { id }) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.tests.detail(id) });
            queryClient.invalidateQueries({ queryKey: queryKeys.tests.lists() });
        },
    });
}

/** Delete a test — invalidates list. */
export function useDeleteTest() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => testsApi.deleteTest(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.tests.lists() });
        },
    });
}

/** Start a test attempt. */
export function useStartAttempt() {
    return useMutation({
        mutationFn: ({ testId, learnerId }: { testId: string; learnerId: string }) =>
            testsApi.startAttempt(testId, learnerId),
    });
}

/** Submit a test attempt with answers. */
export function useSubmitAttempt() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            attemptId,
            dto,
        }: {
            attemptId: string;
            dto: { answers: { questionId: string; answer?: string }[] };
        }) => testsApi.submitAttempt(attemptId, dto),
        onSuccess: (_data, { attemptId }) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.attempts.detail(attemptId) });
            queryClient.invalidateQueries({ queryKey: queryKeys.attempts.all });
        },
    });
}
