/**
 * Barrel export for all TanStack Query + Zustand hooks.
 * Import from "@/lib/hooks" instead of individual files for cleaner imports.
 *
 * Note: useStartAttempt and useSubmitAttempt exist in both use-tests and
 * use-attempts with slightly different signatures. Export both explicitly
 * to avoid ambiguity — prefer `use-attempts` versions for submission-service
 * and `use-tests` versions for test-service operations.
 */

// Auth
export * from './use-auth';

// Analytics
export * from './use-analytics';

// Tests (excludes attempt-related that conflict with use-attempts)
export {
  useTests,
  useTestById,
  useTestSections,
  useWritingTasks,
  useSpeakingParts,
  useGroupQuestions,
  useAttemptsByLearnerId,
  useCreateTest,
  useUpdateTest,
  useDeleteTest,
  useStartAttempt as useStartAttemptViaTestService,
  useSubmitAttempt as useSubmitAttemptViaTestService,
} from './use-tests';

// Attempts & Submissions (canonical attempt hooks)
export * from './use-attempts';
