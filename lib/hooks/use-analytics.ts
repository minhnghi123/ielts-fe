import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { analyticsApi } from '@/lib/api/analytics';
import { queryKeys } from '@/lib/query-keys';

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

/** Fetch mistake records for a learner. */
export function useMistakes(learnerId: string | undefined) {
    return useQuery({
        queryKey: queryKeys.analytics.mistakes(learnerId ?? ''),
        queryFn: () => analyticsApi.getMistakes(learnerId!),
        enabled: !!learnerId,
        staleTime: 120_000,
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
