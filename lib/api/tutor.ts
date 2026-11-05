import apiClient from '@/lib/api';
import type { ApiResponse } from '@/lib/types';
import type { ErrorCause } from '@/lib/error-causes';

export interface HintResult {
    level: 2 | 3;
    location: string | null;
    paragraph: number | null;
    keywords: string[];
    paraphrase: string | null;
    verified: boolean;
}

export interface HintRequest {
    questionId: string;
    level: 2 | 3;
    skill: 'reading' | 'listening';
    questionType: string;
    questionText: string;
    instructions: string | null;
    passage: string | null;
    options: unknown;
}

export const tutorApi = {
    selfCause: (input: { questionId: string; attemptId?: string; selfCause: ErrorCause }) =>
        apiClient.patch<ApiResponse<{ id: string; errorCause: string | null; selfCause: string; agrees: boolean }>>('/api/analytics/tutor/self-cause', input).then((r) => r.data.data),
    hint: async (input: HintRequest): Promise<HintResult> => {
        const res = await fetch('/api/ai/hint', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input), credentials: 'include' });
        if (!res.ok) throw new Error(((await res.json().catch(() => ({}))) as { error?: string }).error ?? 'Không lấy được gợi ý');
        return (await res.json()) as HintResult;
    },
};

/** Which "why did you choose this?" options make sense for a question type. */
export function selfCauseOptions(questionType: string | null, skill: string): ErrorCause[] {
    const t = (questionType ?? '').toLowerCase();
    const base: ErrorCause[] = ['paraphrase_miss', skill === 'listening' ? 'distractor' : 'location_miss', 'inference'];
    if (t.includes('true_false') || t.includes('yes_no')) base.unshift('tfng_confusion');
    if (t.includes('fill') || t.includes('completion') || t.includes('short_answer') || t.includes('labelling')) base.push('spelling', 'word_limit');
    if (t.includes('multiple') || t.includes('matching')) base.push('distractor');
    base.push('unknown');
    return Array.from(new Set(base));
}
