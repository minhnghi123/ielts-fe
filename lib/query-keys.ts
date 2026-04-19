/**
 * Centralized query key factory.
 *
 * Using a single registry:
 * - Prevents key typo bugs across components
 * - Enables precise cache invalidation (e.g. invalidate all 'tests' queries at once)
 * - Makes query relationships easy to reason about
 *
 * Convention: keys go from broad → specific so partial-key invalidation works:
 *   queryClient.invalidateQueries({ queryKey: queryKeys.tests.all })
 *   // invalidates both 'tests.list' and 'tests.detail'
 */
export const queryKeys = {
    // ── Auth ────────────────────────────────────────────────────────────────
    auth: {
        all: ['auth'] as const,
        profile: () => ['auth', 'profile'] as const,
    },

    // ── Tests ───────────────────────────────────────────────────────────────
    tests: {
        all: ['tests'] as const,
        lists: () => ['tests', 'list'] as const,
        list: (params?: {
            skill?: string;
            isMock?: boolean;
            page?: number;
            limit?: number;
        }) => ['tests', 'list', params] as const,
        details: () => ['tests', 'detail'] as const,
        detail: (id: string) => ['tests', 'detail', id] as const,
        sections: (testId: string) => ['tests', testId, 'sections'] as const,
        writingTasks: (testId: string) => ['tests', testId, 'writing-tasks'] as const,
        speakingParts: (testId: string) => ['tests', testId, 'speaking-parts'] as const,
        questions: (groupId: string) => ['groups', groupId, 'questions'] as const,
    },

    // ── Attempts ─────────────────────────────────────────────────────────────
    attempts: {
        all: ['attempts'] as const,
        byLearner: (learnerId: string) => ['attempts', 'learner', learnerId] as const,
        detail: (attemptId: string) => ['attempts', 'detail', attemptId] as const,
    },

    // ── Analytics ────────────────────────────────────────────────────────────
    analytics: {
        all: ['analytics'] as const,
        dashboard: (learnerId: string) => ['analytics', 'dashboard', learnerId] as const,
        bands: (learnerId: string) => ['analytics', 'bands', learnerId] as const,
        progress: (learnerId: string) => ['analytics', 'progress', learnerId] as const,
        mistakes: (learnerId: string) => ['analytics', 'mistakes', learnerId] as const,
        adminStats: () => ['analytics', 'admin', 'global-stats'] as const,
    },

    // ── Submissions ──────────────────────────────────────────────────────────
    submissions: {
        writing: (id: string) => ['submissions', 'writing', id] as const,
        speaking: (id: string) => ['submissions', 'speaking', id] as const,
    },
} as const;
