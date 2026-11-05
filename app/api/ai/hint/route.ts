import { createHash } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import { API_BASE, backendJson, getUserToken, systemHeaders, userHeaders } from '@/lib/server/backend';
import { GROQ_CHAT_MODEL, assertGroqFinished, groqModelOptions } from '@/lib/server/groq';

/**
 * Socratic hints for a drill question (levels 2–3; level 1 is the per-type strategy shown client-side).
 *  - Level 2: WHERE to look (paragraph / what the passage is talking about) — never the answer.
 *  - Level 3: WHICH words in the passage paraphrase the question — keywords are kept only if they really occur in the passage.
 * Cached per (questionId, hash of shown content) so a tampered passage cannot poison other learners' hints.
 */
interface HintBody { questionId?: string; level?: number; skill?: string; questionType?: string; questionText?: string; instructions?: string | null; passage?: string | null; options?: unknown }
interface Hints { location?: string | null; paragraph?: number | null; keywords?: string[]; paraphrase?: string | null; verified?: boolean; redacted?: boolean }

const strip = (s: string | null | undefined) => String(s ?? '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
const norm = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim();

export async function POST(req: NextRequest) {
    const body = (await req.json().catch(() => ({}))) as HintBody;
    const level = body.level === 3 ? 3 : 2;
    if (!body.questionId || !body.questionText) return NextResponse.json({ error: 'Thiếu câu hỏi' }, { status: 400 });
    const token = getUserToken(req);
    if (!token) return NextResponse.json({ error: 'Bạn cần đăng nhập' }, { status: 401 });

    const passage = strip(body.passage);
    const questionText = strip(body.questionText).slice(0, 800);
    const hash = createHash('sha1').update(`${questionText}\n${passage}`).digest('hex').slice(0, 16);

    // Answer key (system role, never sent to the client): used only to redact hints that would reveal the answer.
    let answerTokens: string[] = [];
    try {
        const ak = await fetch(`${API_BASE}/api/drills/answer-key/${body.questionId}`, { headers: systemHeaders() });
        if (ak.ok) {
            const key = await backendJson<{ correctAnswers?: string[] }>(ak);
            answerTokens = (key?.correctAnswers ?? []).flatMap((a) => [norm(String(a)), ...norm(String(a)).split(' ')]).filter((t) => t.length >= 3);
        }
    } catch { /* guard degrades to prompt-only */ }
    const leaks = (text: string | null | undefined) => !!text && answerTokens.some((t) => norm(text).split(' ').includes(t) || (t.includes(' ') && norm(text).includes(t)));

    let hints: Hints | null = null;
    try {
        const cached = await fetch(`${API_BASE}/api/analytics/tutor/hints/${body.questionId}?hash=${hash}`, { headers: userHeaders(token) });
        if (cached.ok) hints = ((await backendJson<{ hintsVi?: Hints } | null>(cached))?.hintsVi) ?? null;
    } catch { /* cache miss */ }

    if (!hints) {
        if (!process.env.GROQ_API_KEY) return NextResponse.json({ error: 'AI chưa được cấu hình' }, { status: 503 });
        const paras = String(body.passage ?? '').replace(/<\/p>|<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '').split(/\n+/).map((p) => p.trim()).filter(Boolean);
        const prompt = [
            `Bạn là gia sư IELTS ${body.skill === 'listening' ? 'Listening' : 'Reading'} theo phương pháp Socratic cho học viên Việt Nam: chỉ dẫn CÁCH tìm, TUYỆT ĐỐI KHÔNG nêu hoặc ám chỉ đáp án.`,
            `Trả lời DUY NHẤT một JSON: {"paragraph": số thứ tự đoạn chứa thông tin (1-based) hoặc null, "location_vi": 1 câu tiếng Việt mô tả đoạn/phần cần đọc hoặc nghe (không nêu đáp án), "keywords": 2–4 từ/cụm NGUYÊN VĂN trong bài là paraphrase của từ khoá trong câu hỏi (không được là đáp án), "paraphrase_vi": 1 câu tiếng Việt giải thích từ khoá trong câu hỏi được diễn đạt lại thế nào trong bài}.`,
            `DẠNG CÂU: ${body.questionType ?? ''}`,
            body.instructions ? `HƯỚNG DẪN: ${strip(body.instructions).slice(0, 300)}` : '',
            `CÂU HỎI: ${questionText}`,
            body.options ? `LỰA CHỌN: ${JSON.stringify(body.options).slice(0, 500)}` : '',
            answerTokens.length ? `CẤM TUYỆT ĐỐI nhắc tới các từ sau (là đáp án): ${Array.from(new Set(answerTokens)).join(', ')} — không được đưa vào keywords, location_vi hay paraphrase_vi.` : '',
            paras.length ? `BÀI ĐỌC (${paras.length} đoạn, đánh số):\n${paras.map((p, i) => `[${i + 1}] ${p}`).join('\n').slice(0, 7000)}` : 'BÀI NGHE: không có transcript — chỉ mô tả phần nội dung cần chú ý dựa trên câu hỏi.',
        ].filter(Boolean).join('\n');
        let parsed: { paragraph?: unknown; location_vi?: unknown; keywords?: unknown; paraphrase_vi?: unknown } = {};
        try {
            const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
            const completion = await groq.chat.completions.create({
                model: GROQ_CHAT_MODEL, temperature: 0.2, max_tokens: 400, response_format: { type: 'json_object' },
                messages: [{ role: 'user', content: prompt }], ...groqModelOptions(),
            } as Parameters<typeof groq.chat.completions.create>[0]) as { choices?: Array<{ finish_reason?: string; message?: { content?: string | null } }> };
            assertGroqFinished(completion.choices?.[0]);
            parsed = JSON.parse(completion.choices?.[0]?.message?.content ?? '{}');
        } catch (err) {
            console.error('[hint] groq failed', err);
            return NextResponse.json({ error: 'AI chưa tạo được gợi ý, thử lại sau' }, { status: 502 });
        }
        const np = norm(passage);
        const keywords = (Array.isArray(parsed.keywords) ? parsed.keywords : []).map(String).map((k) => k.trim()).filter((k) => k.length >= 3 && (!np || np.includes(norm(k))) && !leaks(k)).slice(0, 4);
        const paragraph = typeof parsed.paragraph === 'number' && parsed.paragraph >= 1 && parsed.paragraph <= paras.length ? parsed.paragraph : null;
        const location = String(parsed.location_vi ?? '').trim() || null;
        const paraphrase = String(parsed.paraphrase_vi ?? '').trim() || null;
        hints = {
            paragraph,
            location: leaks(location) ? null : location,
            keywords,
            paraphrase: leaks(paraphrase) ? null : paraphrase,
            verified: !!np && keywords.length > 0,
            redacted: leaks(location) || leaks(paraphrase),
        };
        try {
            await fetch(`${API_BASE}/api/analytics/tutor/hints`, { method: 'PUT', headers: systemHeaders(), body: JSON.stringify({ questionId: body.questionId, contentHash: hash, hintsVi: hints, model: GROQ_CHAT_MODEL }) });
        } catch (err) { console.warn('[hint] cache store skipped', err); }
    }

    return NextResponse.json({
        level,
        location: hints.location ?? null,
        paragraph: hints.paragraph ?? null,
        keywords: level === 3 ? (hints.keywords ?? []) : [],
        paraphrase: level === 3 ? (hints.paraphrase ?? null) : null,
        verified: hints.verified ?? false,
        redacted: hints.redacted ?? false,
    });
}
