import apiClient from '@/lib/api';
import type { ApiResponse } from '@/lib/types';

export interface WritingVersion { submissionId: string; gradingId: string | null; revisionNo: number; band: number | null; byType: Record<string, number>; submittedAt: string; diff: WritingDiff | null }
export interface WritingDiff {
    resolved: Array<{ task: number; error_type: string; original_text: string }>;
    remaining: Array<{ task: number; error_type: string; original_text: string }>;
    added: Array<{ task: number; error_type: string; original_text: string }>;
    byType: Record<string, { resolved: number; remaining: number; added: number }>;
    bandBefore: number | null;
    bandAfter: number;
    nextFix: string | null;
}
export interface WritingProgress {
    chains: Array<{ rootId: string; writingTaskId: string; versions: WritingVersion[] }>;
    trend: Array<{ submissionId: string; submittedAt: string; band: number | null; byType: Record<string, number> }>;
    topErrorTypes: Array<{ type: string; n: number }>;
}

export const writingProgressApi = {
    get: (learnerId: string) => apiClient.get<ApiResponse<WritingProgress>>(`/api/learners/${learnerId}/writing-progress`).then((r) => r.data.data),
};
