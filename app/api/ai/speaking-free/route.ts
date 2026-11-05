import { NextRequest, NextResponse } from 'next/server';
import { API_BASE, backendJson, getUserToken, userHeaders } from '@/lib/server/backend';
import { GROQ_CHAT_MODEL, groqModelOptions } from '@/lib/server/groq';
import { fluencyMetrics, tokenize, type TimedWord } from '@/lib/speaking/align';
import type { FreeResult } from '@/lib/api/speaking';

const GROQ_TRANSCRIBE_URL = 'https://api.groq.com/openai/v1/audio/transcriptions';
const GROQ_CHAT_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MAX_BYTES = 15 * 1024 * 1024;
const SILENCE_RMS = 0.004;
const MIN_WORDS = 8;

const SYSTEM_PROMPT = `You are an IELTS Speaking examiner giving feedback to a Vietnamese learner on ONE Part 1 answer.
You receive the question and an automatic transcript (it may contain recognition errors — do not penalise obvious transcription slips).
Return ONLY JSON:
{
  "lexical": number|null,   // IELTS band 4.0–8.0 in 0.5 steps for Lexical Resource, or null if the answer is too short to judge
  "grammar": number|null,   // Grammatical Range & Accuracy band
  "content": number|null,   // How directly and fully the question is answered (band)
  "errors": [ { "type": "grammar"|"vocabulary"|"coherence"|"content", "quote": "exact words from the transcript", "fix": "corrected English", "explainVi": "giải thích ngắn bằng tiếng Việt vì sao sai và quy tắc" } ],  // at most 5, most important first
  "strengthsVi": ["1–2 điểm làm tốt, tiếng Việt"],
  "nextStepVi": "một việc cụ thể nên làm tiếp, tiếng Việt",
  "sampleAnswer": "a natural 3–4 sentence Part 1 answer to the same question, band 7 level, first person"
}
Rules: explanations in Vietnamese; quotes must be verbatim substrings of the transcript; do not rate pronunciation or fluency (they are measured elsewhere); never invent errors that are not in the transcript.`;

/**
 * Free speaking (Part 1): Whisper transcript + measured fluency (wpm, pauses, fillers) + LLM rubric for
 * lexical / grammar / content with Vietnamese error cards. No pronunciation band is claimed.
 */
export async function POST(req: NextRequest) {
    const token = getUserToken(req);
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const groqKey = process.env.GROQ_API_KEY;
    if (!groqKey) return NextResponse.json({ error: 'AI chưa được cấu hình (GROQ_API_KEY)' }, { status: 503 });

    const form = await req.formData();
    const file = form.get('file');
    const question = String(form.get('question') ?? '').trim();
    const exerciseId = (form.get('exerciseId') as string | null) || null;
    const audioUrl = (form.get('audioUrl') as string | null) || null;
    const givenSample = (form.get('sampleAnswer') as string | null) || null;
    const peakRaw = form.get('peakLevel');
    const peakLevel = peakRaw == null || peakRaw === '' ? null : Number(peakRaw);
    if (!(file instanceof Blob) || file.size === 0) return NextResponse.json({ error: 'Thiếu bản ghi âm' }, { status: 400 });
    if (file.size > MAX_BYTES) return NextResponse.json({ error: 'Bản ghi quá lớn (tối đa 15 MB)' }, { status: 413 });
    if (!question) return NextResponse.json({ error: 'Thiếu câu hỏi' }, { status: 400 });

    const upstream = new FormData();
    upstream.append('file', file, 'speech.webm');
    upstream.append('model', process.env.GROQ_WHISPER_MODEL || 'whisper-large-v3-turbo');
    upstream.append('language', 'en');
    upstream.append('response_format', 'verbose_json');
    upstream.append('timestamp_granularities[]', 'word');
    upstream.append('timestamp_granularities[]', 'segment');
    upstream.append('temperature', '0');
    const tr = await fetch(GROQ_TRANSCRIBE_URL, { method: 'POST', headers: { Authorization: `Bearer ${groqKey}` }, body: upstream });
    if (!tr.ok) return NextResponse.json({ error: `Groq ${tr.status}: ${(await tr.text()).slice(0, 200)}` }, { status: 502 });
    const data = (await tr.json()) as { text?: string; duration?: number; words?: Array<{ word: string; start: number; end: number }>; segments?: Array<{ start: number; end: number; no_speech_prob?: number; avg_logprob?: number }> };
    const segs = data.segments ?? [];
    const tooQuiet = peakLevel != null && Number.isFinite(peakLevel) && peakLevel < SILENCE_RMS;
    const whisperSilent = segs.length === 0 || segs.every((sg) => (sg.no_speech_prob ?? 0) > 0.5 || (sg.avg_logprob ?? 0) < -1.0);
    const transcript = tooQuiet || whisperSilent ? '' : (data.text ?? '').trim();
    const timed: TimedWord[] = transcript ? (data.words ?? []).map((w) => ({ word: w.word, start: w.start, end: w.end })) : [];
    const durationS = Math.max(0.1, Number(data.duration ?? timed.at(-1)?.end ?? 0) || 0.1);
    const { wpm, pauses, fillers } = fluencyMetrics(timed, durationS);
    const wordCount = tokenize(transcript).length;

    const empty: FreeResult = { transcript, durationS, wpm, pauses, fillers, scores: { fluencyBand: null, lexical: null, grammar: null, content: null }, errors: [], strengthsVi: [], nextStepVi: '', sampleAnswer: givenSample, commentVi: [], attemptId: null };
    if (!transcript) return NextResponse.json({ ...empty, commentVi: ['Không nhận ra lời nói — hãy nói to, rõ và gần micro hơn rồi thử lại. Lượt này không được tính.'] });
    if (wordCount < MIN_WORDS) return NextResponse.json({ ...empty, commentVi: [`Câu trả lời quá ngắn (${wordCount} từ) để đánh giá. Hãy trả lời ít nhất 2–3 câu: ý chính, một lý do và một ví dụ. Lượt này không được tính.`] });

    // LLM rubric (lexical / grammar / content). Failure here must not lose the measured part.
    let rubric: Partial<Pick<FreeResult, 'errors' | 'strengthsVi' | 'nextStepVi' | 'sampleAnswer'>> & { lexical?: number | null; grammar?: number | null; content?: number | null } = {};
    let rubricError: string | null = null;
    try {
        const chat = await fetch(GROQ_CHAT_URL, {
            method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${groqKey}` },
            body: JSON.stringify({ model: GROQ_CHAT_MODEL, ...groqModelOptions(), temperature: 0.2, max_tokens: 1200, response_format: { type: 'json_object' },
                messages: [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: `Question: ${question}\n\nTranscript (${wordCount} words, ${Math.round(durationS)} s):\n${transcript}` }] }),
        });
        if (!chat.ok) throw new Error(`Groq ${chat.status}`);
        const cj = (await chat.json()) as { choices: Array<{ message: { content: string } }> };
        rubric = JSON.parse(cj.choices[0]?.message?.content ?? '{}');
    } catch (e) {
        rubricError = e instanceof Error ? e.message : 'rubric failed';
    }
    const band = (v: unknown) => (typeof v === 'number' && v >= 1 && v <= 9 ? Math.round(v * 2) / 2 : null);
    const lower = transcript.toLowerCase();
    const errors = (Array.isArray(rubric.errors) ? rubric.errors : [])
        .filter((e) => e && typeof e.quote === 'string' && lower.includes(e.quote.toLowerCase()))
        .slice(0, 5)
        .map((e) => ({ type: (['grammar', 'vocabulary', 'coherence', 'content'].includes(e.type) ? e.type : 'grammar') as FreeResult['errors'][number]['type'], quote: e.quote, fix: String(e.fix ?? ''), explainVi: String(e.explainVi ?? '') }));

    // Persist: measured metrics + rubric; analytics-service computes fluencyBand from wpm/pauses/fillers.
    let attemptId: string | null = null; let fluencyBand: number | null = null;
    try {
        const saved = await backendJson<{ attempt: { id: string; scores: Record<string, number | string | null> } }>(await fetch(`${API_BASE}/api/analytics/speaking/attempts`, {
            method: 'POST', headers: userHeaders(token),
            body: JSON.stringify({ exerciseId: exerciseId ?? undefined, level: 'free', audioUrl: audioUrl ?? undefined, transcript, durationS: Math.round(durationS * 100) / 100, wpm: wpm ?? undefined, pauses, fillers,
                scores: { lexical: band(rubric.lexical), grammar: band(rubric.grammar), content: band(rubric.content) }, errorsJson: errors, provider: 'groq' }),
        }));
        attemptId = saved.attempt.id;
        fluencyBand = typeof saved.attempt.scores.fluencyBand === 'number' ? saved.attempt.scores.fluencyBand : null;
    } catch { /* feedback still returned */ }

    const commentVi: string[] = [];
    if (wpm != null) commentVi.push(wpm < 90 ? `Tốc độ ${wpm} từ/phút hơi chậm (mục tiêu 100–140); hãy nói theo cụm ý thay vì từng từ.` : wpm > 170 ? `Tốc độ ${wpm} từ/phút nhanh — chậm lại một chút để rõ âm cuối.` : `Tốc độ ${wpm} từ/phút — tự nhiên.`);
    if (pauses >= 3) commentVi.push(`${pauses} lần ngắt dài (≥0,5 s); nếu cần thời gian nghĩ, dùng cụm nối như "Well, I'd say…" thay vì im lặng.`);
    if (fillers >= 2) commentVi.push(`${fillers} từ đệm (um/uh).`);
    if (rubricError) commentVi.push('Chưa chấm được từ vựng/ngữ pháp lúc này; phần đo tốc độ và ngắt nghỉ vẫn chính xác.');
    commentVi.push('Phát âm chưa được chấm ở bậc này — hãy nghe lại bản ghi và luyện âm ở bậc Phát âm từ.');

    const result: FreeResult = {
        transcript, durationS, wpm, pauses, fillers,
        scores: { fluencyBand, lexical: band(rubric.lexical), grammar: band(rubric.grammar), content: band(rubric.content) },
        errors, strengthsVi: Array.isArray(rubric.strengthsVi) ? rubric.strengthsVi.filter((x) => typeof x === 'string').slice(0, 3) : [],
        nextStepVi: typeof rubric.nextStepVi === 'string' ? rubric.nextStepVi : '',
        sampleAnswer: givenSample ?? (typeof rubric.sampleAnswer === 'string' ? rubric.sampleAnswer : null),
        commentVi, attemptId,
    };
    return NextResponse.json(result);
}
