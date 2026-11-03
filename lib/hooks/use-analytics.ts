import type { MistakeStatus } from '@/lib/types';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { analyticsApi, type MistakeFilters } from '@/lib/api/analytics';
import { queryKeys } from '@/lib/query-keys';
import type { LearnerGoalsInput } from '@/lib/types';

// ─── Queries ──────────────────────────────────────────────────────────────────

/**
 * Fetch the full learner dashboard summary (band profiles, progress, mistakes, etc.)
 * staleTime: 60s — analytics data is expensive to compute so we cache aggressively.
 */
export function useAnalyticsDashboard(learnerId: string | undefined) {
    return useQuery({
        queryKey: queryKeys.analytics.dashboard(learnerId ?? ''),
        queryFn: () => analyticsApi.getDashboardSummary(learnerId!),
        enabled: !!learnerId,
        staleTime: 60_000,
    });
}

/** Learner goals (targets, exam date, study budget). `null` = not set yet. */
export function useLearnerGoals(learnerId: string | undefined) {
    return useQuery({
        queryKey: queryKeys.analytics.goals(learnerId ?? ''),
        queryFn: () => analyticsApi.getGoals(learnerId!),
        enabled: !!learnerId,
        staleTime: 60_000,
    });
}

/** Mistake notebook rows (filters: status, skill, questionType, attemptId, due). */
export function useMistakes(learnerId: string | undefined, filters: MistakeFilters = {}) {
    return useQuery({
        queryKey: queryKeys.analytics.mistakes(learnerId ?? '', filters),
        queryFn: () => analyticsApi.getMistakes(learnerId!, filters),
        enabled: !!learnerId,
        staleTime: 30_000,
    });
}

/** Counts by error cause / question type, for the whole notebook or one attempt. */
export function useMistakeSummary(learnerId: string | undefined, attemptId?: string) {
    return useQuery({
        queryKey: queryKeys.analytics.mistakeSummary(learnerId ?? '', attemptId),
        queryFn: () => analyticsApi.getMistakeSummary(learnerId!, attemptId),
        enabled: !!learnerId,
        staleTime: 30_000,
    });
}

export function useUpdateMistakeStatus(learnerId: string | undefined) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, status }: { id: string; status: MistakeStatus }) => analyticsApi.updateMistakeStatus(id, status),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['analytics', 'mistakes', learnerId ?? ''] });
            qc.invalidateQueries({ queryKey: ['analytics', 'mistake-summary', learnerId ?? ''] });
        },
    });
}

/** Fetch band profiles for a learner. */
export function useBandProfiles(learnerId: string | undefined) {
    return useQuery({
        queryKey: queryKeys.analytics.bands(learnerId ?? ''),
        queryFn: () => analyticsApi.getBandProfiles(learnerId!),
        enabled: !!learnerId,
        staleTime: 60_000,
    });
}

/** Fetch progress snapshots for the learner chart. */
export function useProgress(learnerId: string | undefined) {
    return useQuery({
        queryKey: queryKeys.analytics.progress(learnerId ?? ''),
        queryFn: () => analyticsApi.getProgress(learnerId!),
        enabled: !!learnerId,
        staleTime: 60_000,
    });
}

/** Fetch admin-level global platform stats. */
export function useAdminGlobalStats() {
    return useQuery({
        queryKey: queryKeys.analytics.adminStats(),
        queryFn: () => analyticsApi.getAdminGlobalStats(),
        staleTime: 60_000,
    });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useUpsertLearnerGoals(learnerId: string | undefined) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (dto: LearnerGoalsInput) => analyticsApi.upsertGoals(learnerId!, dto),
        onSuccess: (goals) => {
            if (!learnerId) return;
            qc.setQueryData(queryKeys.analytics.goals(learnerId), goals);
            // targets were pushed into band profiles too
            qc.invalidateQueries({ queryKey: queryKeys.analytics.bands(learnerId) });
            qc.invalidateQueries({ queryKey: queryKeys.analytics.dashboard(learnerId) });
        },
    });
}

/** Sync analytics for a specific learner — invalidates their analytics cache. */
export function useSyncLearner() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (learnerId: string) => analyticsApi.syncLearner(learnerId),
        onSuccess: (_data, learnerId) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.analytics.dashboard(learnerId) });
            queryClient.invalidateQueries({ queryKey: queryKeys.analytics.bands(learnerId) });
            queryClient.invalidateQueries({ queryKey: queryKeys.analytics.progress(learnerId) });
        },
    });
}

/** Sync analytics for ALL learners — invalidates the admin stats cache too. */
export function useSyncAll() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: () => analyticsApi.syncAll(),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.analytics.all });
        },
    });
}

/** Upsert a band profile for a learner. */
export function useUpsertBandProfile() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: analyticsApi.upsertBandProfile,
        onSuccess: (_data, dto) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.analytics.bands(dto.learnerId) });
            queryClient.invalidateQueries({ queryKey: queryKeys.analytics.dashboard(dto.learnerId) });
        },
    });
}
