import apiClient from '@/lib/api';
import type { ApiResponse } from '@/lib/types';

export type SpeakingLevel = 'word' | 'sentence_build' | 'sentence' | 'free';
export type WordStatus = 'correct' | 'substituted' | 'omitted' | 'inserted';
export interface WordResult { word: string; status: WordStatus; heard?: string | null; sounds?: Array<{ expected: string; actual: string | null }> }

export interface SpeakingExercise {
    id: string; level: SpeakingLevel; text: string; ipa: string | null; targetSounds: string[]; topic: string | null;
    difficulty: number; shuffledTokens: string[] | null; sampleAnswer: string | null; tipVi: string | null;
}
export interface SpeakingAttempt {
    id: string; exerciseId: string | null; level: SpeakingLevel; audioUrl: string | null; transcript: string | null;
    durationS: string | number | null; wpm: number | null; pauses: number | null; fillers: number | null;
    wordResults: WordResult[] | null; scores: Record<string, number | string | null>; createdAt: string;
}
export interface SoundInfo { sound: string; label: string; tip: string }
export interface SpeakingSummary {
    byLevel: Record<SpeakingLevel, { attempts: number; avgOverall: number | null; lastAt: string | null }>;
    weakSounds: Array<{ sound: string; label: string; tipVi: string | null; rating: number; attempts: number; correct: number; level: string }>;
    sounds: Array<{ sound: string; label: string; tipVi: string | null; rating: number; attempts: number; correct: number; level: string }>;
}
/** What /api/ai/speaking-score returns: scored words + measured fluency + the saved attempt. */
export interface ScoreResult {
    transcript: string; durationS: number; wpm: number | null; pauses: number; fillers: number;
    wordResults: WordResult[];
    scores: { accuracy: number; completeness: number; fluency: number; overall: number };
    sounds: Array<{ sound: string; correct: boolean }>;
    commentVi: string[];
    attemptId: string | null;
}

const base = '/api/analytics/speaking';
export const speakingApi = {
    exercises: (q: { level?: SpeakingLevel; topic?: string; sound?: string; limit?: number; offset?: number }) => {
        const p = new URLSearchParams();
        Object.entries(q).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== '') p.set(k, String(v)); });
        return apiClient.get<ApiResponse<{ items: SpeakingExercise[]; total: number }>>(`${base}/exercises?${p}`).then((r) => r.data.data);
    },
    sounds: () => apiClient.get<ApiResponse<SoundInfo[]>>(`${base}/sounds`).then((r) => r.data.data),
    summary: (learnerId: string) => apiClient.get<ApiResponse<SpeakingSummary>>(`${base}/summary/${learnerId}`).then((r) => r.data.data),
    attempts: (learnerId: string, q: { exerciseId?: string; level?: SpeakingLevel; limit?: number } = {}) => {
        const p = new URLSearchParams();
        Object.entries(q).forEach(([k, v]) => { if (v !== undefined) p.set(k, String(v)); });
        return apiClient.get<ApiResponse<SpeakingAttempt[]>>(`${base}/attempts/${learnerId}?${p}`).then((r) => r.data.data);
    },
    deleteAudio: (id: string) => apiClient.delete<ApiResponse<SpeakingAttempt>>(`${base}/attempts/${id}/audio`).then((r) => r.data.data),
    /** Record → Groq Whisper (word timestamps) → alignment → saved attempt. */
    score: async (input: { blob: Blob; referenceText: string; level: SpeakingLevel; exerciseId?: string; targetSounds?: string[]; audioUrl?: string | null; peakLevel?: number | null }) => {
        const fd = new FormData();
        fd.append('file', input.blob, 'speech.webm');
        fd.append('referenceText', input.referenceText);
        fd.append('level', input.level);
        if (input.exerciseId) fd.append('exerciseId', input.exerciseId);
        if (input.targetSounds?.length) fd.append('targetSounds', input.targetSounds.join(','));
        if (input.audioUrl) fd.append('audioUrl', input.audioUrl);
        if (input.peakLevel != null) fd.append('peakLevel', String(input.peakLevel));
        const res = await fetch('/api/ai/speaking-score', { method: 'POST', body: fd, credentials: 'include' });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json?.error || 'Không chấm được bản ghi');
        return json as ScoreResult;
    },
};
