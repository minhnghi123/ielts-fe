import apiClient from '@/lib/api';
import type { ApiResponse, EvidenceAnchor, Question } from '@/lib/types';

export interface DrillItem {
    question: Question;
    instructions: string | null;
    passage: string | null;
    audioUrl: string | null;
    startMs: number | null;
    fromNotebook: boolean;
    testTitle: string | null;
}

export interface DrillBuild {
    items: DrillItem[];
    meta: { skill: string; questionType: string | null; errorCause: string | null; fromNotebook: number };
}

export interface DrillCheck {
    isCorrect: boolean;
    correctAnswers: string[];
    explanation: string | null;
    evidenceAnchor: EvidenceAnchor | null;
    errorCause: string | null;
    fromNotebook: boolean;
}

export interface BuildDrillInput {
    skill: 'listening' | 'reading';
    questionType?: string;
    errorCause?: string;
    limit?: number;
}

export const drillsApi = {
    build: (input: BuildDrillInput) =>
        apiClient.post<ApiResponse<DrillBuild>>('/api/drills/build', input).then((r) => r.data.data),
    check: (skill: string, questionId: string, answer: string, hintLevel?: number) =>
        apiClient
            .post<ApiResponse<DrillCheck>>(`/api/drills/check?skill=${encodeURIComponent(skill)}`, { questionId, answer, ...(hintLevel ? { hintLevel } : {}) })
            .then((r) => r.data.data),
};

/** Build the /drill URL from a result-screen or notebook context. */
export function drillHref(input: BuildDrillInput): string {
    const p = new URLSearchParams({ skill: input.skill });
    if (input.questionType) p.set('questionType', input.questionType);
    if (input.errorCause) p.set('errorCause', input.errorCause);
    return `/drill?${p.toString()}`;
}
