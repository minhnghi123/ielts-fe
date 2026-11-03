import { NextRequest, NextResponse } from 'next/server';
import { getUserToken } from '@/lib/server/backend';

const GROQ_TRANSCRIBE_URL = 'https://api.groq.com/openai/v1/audio/transcriptions';
const MAX_BYTES = 25 * 1024 * 1024;

/**
 * Speech-to-text for the Speaking test using Groq Whisper.
 * Replaces the browser-only SpeechRecognition API (Chrome-only, no word timing),
 * so the transcript the examiner grades is the same on every device.
 */
export async function POST(req: NextRequest) {
    if (!getUserToken(req)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const groqKey = process.env.GROQ_API_KEY;
    if (!groqKey) {
        return NextResponse.json({ error: 'GROQ_API_KEY not configured' }, { status: 500 });
    }

    const form = await req.formData();
    const file = form.get('file');
    if (!(file instanceof Blob) || file.size === 0) {
        return NextResponse.json({ error: 'No audio provided' }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
        return NextResponse.json({ error: 'Audio too large (max 25 MB)' }, { status: 413 });
    }

    const upstream = new FormData();
    upstream.append('file', file, 'answer.webm');
    upstream.append('model', process.env.GROQ_WHISPER_MODEL || 'whisper-large-v3-turbo');
    upstream.append('language', 'en');
    upstream.append('response_format', 'verbose_json');
    upstream.append('temperature', '0');

    const res = await fetch(GROQ_TRANSCRIBE_URL, {
        method: 'POST',
        headers: { Authorization: `Bearer ${groqKey}` },
        body: upstream,
    });

    if (!res.ok) {
        const detail = await res.text();
        console.error('[transcribe] Groq error:', detail.slice(0, 300));
        return NextResponse.json({ error: 'Transcription failed' }, { status: 502 });
    }

    const data = (await res.json()) as {
        text?: string;
        duration?: number;
        segments?: Array<{ start: number; end: number; text: string; no_speech_prob?: number }>;
    };

    const text = (data.text ?? '').trim();
    const words = text ? text.split(/\s+/).length : 0;
    const duration = data.duration ?? (data.segments?.at(-1)?.end ?? 0);
    const wordsPerMinute = duration > 0 ? Math.round((words / duration) * 60) : null;

    return NextResponse.json({
        transcript: text,
        durationSeconds: duration,
        wordCount: words,
        wordsPerMinute,
        segments: data.segments?.map((s) => ({ start: s.start, end: s.end, text: s.text.trim() })) ?? [],
    });
}
