import { NextRequest, NextResponse } from 'next/server';
import { API_BASE, backendJson, getUserToken, userHeaders } from '@/lib/server/backend';
import { alignWords, fluencyMetrics, soundDiff, tokenize, type TimedWord } from '@/lib/speaking/align';
import type { ScoreResult, SpeakingLevel, WordResult } from '@/lib/api/speaking';

const GROQ_TRANSCRIBE_URL = 'https://api.groq.com/openai/v1/audio/transcriptions';
const MAX_BYTES = 10 * 1024 * 1024;
const LEVELS: SpeakingLevel[] = ['word', 'sentence_build', 'sentence', 'free'];
/** RMS (0–1) below which a recording is treated as silence; normal speech sits around 0.05–0.3. */
const SILENCE_RMS = 0.004;
const HALLUCINATIONS = new Set(['you', 'thank you', 'thanks', 'bye', 'the', 'oh', 'so', 'okay', 'thank you very much', 'thanks for watching', 'you you', 'yeah', 'hmm', 'mm', 'uh', 'um']);

/**
 * Scripted scoring: reference text + short recording → Groq Whisper (word timestamps) → alignment →
 * per-word correct / substituted / omitted (+ probable missed sounds) and measured fluency.
 * Saves the attempt on the backend with the learner's own token (ownership enforced there).
 * Limitation (shown in UI): recognition-based — subtle pronunciation errors may pass unnoticed.
 */
export async function POST(req: NextRequest) {
    const token = getUserToken(req);
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const groqKey = process.env.GROQ_API_KEY;
    if (!groqKey) return NextResponse.json({ error: 'AI chưa được cấu hình (GROQ_API_KEY)' }, { status: 503 });

    const form = await req.formData();
    const file = form.get('file');
    const referenceText = String(form.get('referenceText') ?? '').trim();
    const level = String(form.get('level') ?? 'word') as SpeakingLevel;
    const exerciseId = (form.get('exerciseId') as string | null) || null;
    const audioUrl = (form.get('audioUrl') as string | null) || null;
    const targetSounds = String(form.get('targetSounds') ?? '').split(',').map((s) => s.trim()).filter(Boolean);
    const peakRaw = form.get('peakLevel');
    const peakLevel = peakRaw == null || peakRaw === '' ? null : Number(peakRaw);
    if (!(file instanceof Blob) || file.size === 0) return NextResponse.json({ error: 'Thiếu bản ghi âm' }, { status: 400 });
    if (file.size > MAX_BYTES) return NextResponse.json({ error: 'Bản ghi quá lớn (tối đa 10 MB)' }, { status: 413 });
    if (!LEVELS.includes(level) || level === 'free') return NextResponse.json({ error: 'level không hợp lệ cho chấm theo văn bản' }, { status: 400 });
    if (!referenceText) return NextResponse.json({ error: 'Thiếu văn bản mẫu' }, { status: 400 });

    const upstream = new FormData();
    upstream.append('file', file, 'speech.webm');
    upstream.append('model', process.env.GROQ_WHISPER_MODEL || 'whisper-large-v3-turbo');
    upstream.append('language', 'en');
    upstream.append('response_format', 'verbose_json');
    upstream.append('timestamp_granularities[]', 'word');
    upstream.append('timestamp_granularities[]', 'segment');
    upstream.append('temperature', '0');
    // Bias recognition toward the expected text so near-misses are kept as words instead of dropped.
    upstream.append('prompt', referenceText.slice(0, 200));

    const groqRes = await fetch(GROQ_TRANSCRIBE_URL, { method: 'POST', headers: { Authorization: `Bearer ${groqKey}` }, body: upstream });
    if (!groqRes.ok) {
        const t = await groqRes.text();
        return NextResponse.json({ error: `Groq ${groqRes.status}: ${t.slice(0, 200)}` }, { status: 502 });
    }
    const data = (await groqRes.json()) as { text?: string; duration?: number; words?: Array<{ word: string; start: number; end: number }>; segments?: Array<{ start: number; end: number; text: string; no_speech_prob?: number; avg_logprob?: number }> };
    // Whisper hallucinates short tokens ("you", "Thank you.") on silence/noise; treat those as no speech.
    // Whisper can be *confident* on pure silence (no_speech_prob 0, text "you"), so three independent signals:
    // measured mic level from the recorder, Whisper's own flags, and the classic silence-hallucination phrases
    // when they share no word with the reference text.
    const segs = data.segments ?? [];
    const rawText = (data.text ?? '').trim();
    const rawTokens = tokenize(rawText);
    const refTokens = tokenize(referenceText);
    const tooQuiet = peakLevel != null && Number.isFinite(peakLevel) && peakLevel < SILENCE_RMS;
    const whisperSaysSilent = segs.length === 0 || segs.every((sg) => (sg.no_speech_prob ?? 0) > 0.5 || (sg.avg_logprob ?? 0) < -1.0);
    const hallucinated = rawTokens.length <= 3 && HALLUCINATIONS.has(rawTokens.join(' ')) && !rawTokens.some((t) => refTokens.includes(t));
    const silent = tooQuiet || whisperSaysSilent || hallucinated;
    const transcript = silent ? '' : rawText;
    const timed: TimedWord[] = silent ? [] : (data.words ?? []).map((w) => ({ word: w.word, start: w.start, end: w.end }));
    const durationS = Math.max(0.1, Number(data.duration ?? (timed.at(-1)?.end ?? data.segments?.at(-1)?.end ?? 0)) || 0.1);

    const reference = refTokens;
    const heard = timed.length ? timed.map((w) => w.word).join(' ') : transcript;
    const aligned = alignWords(reference, tokenize(heard));
    const wordResults: WordResult[] = aligned.map((w) => {
        if (w.status === 'substituted') return { ...w, sounds: soundDiff(w.word, w.heard, targetSounds) };
        if (w.status === 'omitted') return { ...w, sounds: soundDiff(w.word, null, targetSounds) };
        return w;
    });
    const { wpm, pauses, fillers } = fluencyMetrics(timed, durationS);

    // Persist (scores recomputed server-side in analytics-service); failure to save must not hide the feedback.
    let attemptId: string | null = null; let scores = { accuracy: 0, completeness: 0, fluency: 0, overall: 0 }; let sounds: Array<{ sound: string; correct: boolean }> = [];
    try {
        const saved = await backendJson<{ attempt: { id: string; scores: typeof scores }; sounds: typeof sounds }>(await fetch(`${API_BASE}/api/analytics/speaking/attempts`, {
            method: 'POST', headers: userHeaders(token),
            body: JSON.stringify({ exerciseId: exerciseId ?? undefined, level, audioUrl: audioUrl ?? undefined, transcript, durationS: Math.round(durationS * 100) / 100, wpm: wpm ?? undefined, pauses, fillers, wordResults, provider: 'groq' }),
        }));
        attemptId = saved.attempt.id; scores = saved.attempt.scores; sounds = saved.sounds;
    } catch {
        const ref = wordResults.filter((w) => w.status !== 'inserted');
        const acc = ref.length ? ref.filter((w) => w.status === 'correct').length / ref.length : 0;
        const comp = ref.length ? ref.filter((w) => w.status !== 'omitted').length / ref.length : 0;
        scores = { accuracy: Math.round(acc * 100), completeness: Math.round(comp * 100), fluency: 100, overall: Math.round(100 * (0.6 * acc + 0.25 + 0.15 * comp)) };
    }

    const result: ScoreResult = { transcript, durationS, wpm, pauses, fillers, wordResults, scores, sounds, commentVi: comments(wordResults, wpm, pauses, fillers, reference.length), attemptId };
    return NextResponse.json(result);
}

function comments(words: WordResult[], wpm: number | null, pauses: number, fillers: number, refLen: number): string[] {
    const out: string[] = [];
    const wrong = words.filter((w) => w.status === 'substituted');
    const omitted = words.filter((w) => w.status === 'omitted');
    if (!words.some((w) => w.status !== 'omitted')) return ['Không nhận ra từ nào — hãy nói to, rõ và gần micro hơn rồi thử lại.'];
    if (wrong.length === 0 && omitted.length === 0) out.push(refLen === 1 ? 'Từ này được nhận diện đúng. Nghe lại bản ghi và so với giọng mẫu để kiểm tra trọng âm.' : 'Mọi từ đều được nhận diện đúng — tốt lắm!');
    if (wrong.length) out.push(`Nghe thành từ khác: ${wrong.slice(0, 3).map((w) => `"${w.word}" → "${w.heard}"`).join(', ')}. Thử phát âm chậm từng âm rồi ghép lại.`);
    if (omitted.length) out.push(`Bỏ sót hoặc không rõ: ${omitted.slice(0, 4).map((w) => `"${w.word}"`).join(', ')}.`);
    if (refLen >= 6 && wpm != null) {
        if (wpm < 80) out.push(`Tốc độ ${wpm} từ/phút hơi chậm; mục tiêu 100–140 từ/phút.`);
        else if (wpm > 170) out.push(`Tốc độ ${wpm} từ/phút khá nhanh — hãy nói chậm lại để rõ âm cuối.`);
        else out.push(`Tốc độ ${wpm} từ/phút — vừa phải.`);
    }
    if (pauses >= 2 && refLen >= 6) out.push(`Có ${pauses} lần ngắt dài (≥0,5 s). Thử đọc theo cụm ý thay vì từng từ.`);
    if (fillers > 0) out.push(`Có ${fillers} từ đệm (um/uh). Hãy im lặng ngắn thay vì chêm từ đệm.`);
    return out;
}
