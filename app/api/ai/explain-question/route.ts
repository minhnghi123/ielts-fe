import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import { GROQ_CHAT_MODEL, groqModelOptions, assertGroqFinished } from '@/lib/server/groq';
import { API_BASE, backendJson, getUserToken, systemHeaders, userHeaders } from '@/lib/server/backend';
import { ERROR_CAUSES } from '@/lib/error-causes';

/**
 * POST /api/ai/explain-question  { attemptId, questionId }
 *
 * Returns a Vietnamese explanation for one wrong answer:
 *  1. author explanation / evidence anchor on the question (always preferred),
 *  2. cached row in question_explanations for (question, this wrong answer),
 *  3. otherwise ask Groq, verify the quoted evidence really exists in the
 *     passage, store it through the trusted server identity, return it.
 * The attempt is loaded with the learner's own token so the gateway enforces
 * ownership and the "no answer keys before submission" rule.
 */

interface ExplainBody { attemptId?: string; questionId?: string }

interface Explanation {
    source: 'author' | 'teacher' | 'ai';
    explanationId?: string;
    errorCause: string | null;
    evidenceQuote: string | null;
    evidenceParagraph: number | null;
    evidenceStartMs: number | null;
    explanationVi: string;
    tipVi: string | null;
}

const norm = (s: string) => s.replace(/\s+/g, ' ').trim().toLowerCase();

function findQuoteInText(quote: string | null | undefined, text: string | null | undefined): boolean {
    if (!quote || !text) return false;
    const q = norm(quote).replace(/[“”"']/g, '');
    const t = norm(text.replace(/<[^>]+>/g, ' ')).replace(/[“”"']/g, '');
    return q.length >= 8 && t.includes(q);
}

export async function POST(req: NextRequest) {
    const body = (await req.json().catch(() => ({}))) as ExplainBody;
    if (!body.attemptId || !body.questionId) {
        return NextResponse.json({ error: 'attemptId và questionId là bắt buộc' }, { status: 400 });
    }
    const token = getUserToken(req);
    if (!token) return NextResponse.json({ error: 'Bạn cần đăng nhập' }, { status: 401 });

    // 1. Attempt (ownership enforced by the gateway) — must be submitted.
    const attemptRes = await fetch(`${API_BASE}/api/attempts/${body.attemptId}`, { headers: userHeaders(token) });
    if (!attemptRes.ok) return NextResponse.json({ error: 'Không truy cập được bài làm' }, { status: attemptRes.status });
    const attempt = await backendJson<any>(attemptRes);
    if (!attempt?.submittedAt) {
        return NextResponse.json({ error: 'Chỉ xem giải thích sau khi nộp bài' }, { status: 403 });
    }
    const qa = (attempt.questionAttempts ?? []).find((x: any) => x.questionId === body.questionId);
    if (!qa) return NextResponse.json({ error: 'Câu hỏi không thuộc bài làm này' }, { status: 404 });

    const testRes = await fetch(`${API_BASE}/api/tests/${attempt.testId}`, { headers: userHeaders(token) });
    const test = testRes.ok ? await backendJson<any>(testRes) : null;

    let question: any = qa.question ?? null;
    let group: any = null;
    let section: any = null;
    for (const sec of test?.sections ?? []) {
        for (const g of sec.questionGroups ?? []) {
            const q = (g.questions ?? []).find((x: any) => x.id === body.questionId);
            if (q) { question = { ...q, ...(question ?? {}) }; group = g; section = sec; }
        }
    }
    if (!question) return NextResponse.json({ error: 'Không tìm thấy câu hỏi' }, { status: 404 });

    const userAnswer: string = qa.answer ?? '';
    const correctAnswers: string[] = Array.isArray(question.answer?.correctAnswers)
        ? question.answer.correctAnswers.map(String)
        : [];
    const passage: string | null = section?.passage ?? null;
    const anchor = question.evidenceAnchor ?? null;

    // 2. Author-written content wins.
    if (question.explanation && String(question.explanation).trim()) {
        const result: Explanation = {
            source: 'author',
            errorCause: null,
            evidenceQuote: anchor?.quote ?? null,
            evidenceParagraph: anchor?.kind === 'passage' ? anchor.paragraph ?? null : null,
            evidenceStartMs: anchor?.kind === 'audio' ? anchor.startMs ?? null : null,
            explanationVi: String(question.explanation),
            tipVi: null,
        };
        return NextResponse.json(result);
    }

    // 3. Cache.
    const cacheUrl = `${API_BASE}/api/analytics/explanations?questionId=${encodeURIComponent(body.questionId)}&userAnswer=${encodeURIComponent(userAnswer)}`;
    const cacheRes = await fetch(cacheUrl, { headers: userHeaders(token) });
    const cached = cacheRes.ok ? await backendJson<any>(cacheRes) : null;
    if (cached?.explanationVi) {
        return NextResponse.json({
            source: cached.source ?? 'ai',
            explanationId: cached.id,
            errorCause: cached.errorCause ?? null,
            evidenceQuote: cached.evidenceQuote ?? anchor?.quote ?? null,
            evidenceParagraph: anchor?.kind === 'passage' ? anchor.paragraph ?? null : null,
            evidenceStartMs: anchor?.kind === 'audio' ? anchor.startMs ?? null : null,
            explanationVi: cached.explanationVi,
            tipVi: cached.tipVi ?? null,
        } satisfies Explanation);
    }

    // 4. Ask the model.
    if (!process.env.GROQ_API_KEY) {
        return NextResponse.json({ error: 'AI chưa được cấu hình' }, { status: 503 });
    }
    const skill: string = test?.skill ?? attempt.test?.skill ?? 'reading';
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const prompt = [
        `Bạn là giáo viên IELTS ${skill === 'listening' ? 'Listening' : 'Reading'} giàu kinh nghiệm, giải thích cho học viên Việt Nam.`,
        `Trả lời DUY NHẤT một JSON hợp lệ với các khoá: "error_cause" (một trong: ${ERROR_CAUSES.join(', ')}), "evidence_quote" (trích NGUYÊN VĂN tiếng Anh ≤ 25 từ từ ĐOẠN VĂN chứa đáp án, hoặc "" nếu không có đoạn văn), "explanation_vi" (2–4 câu tiếng Việt: đáp án đúng nằm ở đâu, bài diễn đạt lại thế nào, vì sao câu trả lời của học viên sai), "tip_vi" (1 câu tiếng Việt: mẹo để lần sau không sai dạng này).`,
        `Không bịa trích dẫn. Giữ nguyên các thuật ngữ IELTS bằng tiếng Anh.`,
        ``,
        `DẠNG CÂU: ${question.questionType}`,
        group?.instructions ? `HƯỚNG DẪN NHÓM: ${String(group.instructions).replace(/<[^>]+>/g, ' ').slice(0, 300)}` : '',
        `CÂU HỎI: ${String(question.questionText ?? '').replace(/<[^>]+>/g, ' ').slice(0, 600)}`,
        question.config?.options ? `LỰA CHỌN: ${JSON.stringify(question.config.options).slice(0, 600)}` : '',
        `ĐÁP ÁN ĐÚNG: ${correctAnswers.join(' / ') || '(không có)'}`,
        `HỌC VIÊN TRẢ LỜI: ${userAnswer.trim() || '(bỏ trống)'}`,
        passage ? `ĐOẠN VĂN:\n${passage.replace(/<[^>]+>/g, '\n').slice(0, 6000)}` : 'ĐOẠN VĂN: (bài nghe — không có transcript)',
    ].filter(Boolean).join('\n');

    let parsed: any;
    try {
        const completion = await groq.chat.completions.create({
            model: GROQ_CHAT_MODEL,
            temperature: 0.2,
            max_tokens: 700,
            response_format: { type: 'json_object' },
            messages: [{ role: 'user', content: prompt }],
            ...groqModelOptions(),
        } as any);
        assertGroqFinished(completion.choices?.[0]);
        parsed = JSON.parse(completion.choices[0]?.message?.content ?? '{}');
    } catch (err) {
        console.error('[explain-question] groq failed', err);
        return NextResponse.json({ error: 'AI chưa tạo được giải thích, thử lại sau' }, { status: 502 });
    }

    const explanationVi = String(parsed.explanation_vi ?? '').trim();
    if (!explanationVi) return NextResponse.json({ error: 'AI trả về nội dung rỗng' }, { status: 502 });
    const errorCause = ERROR_CAUSES.includes(parsed.error_cause) ? parsed.error_cause : null;
    // Only keep a quote we can actually find in the passage — never show invented evidence.
    const quote = findQuoteInText(parsed.evidence_quote, passage) ? String(parsed.evidence_quote).trim() : (anchor?.quote ?? null);
    const tipVi = String(parsed.tip_vi ?? '').trim() || null;

    let explanationId: string | undefined;
    try {
        const stored = await fetch(`${API_BASE}/api/analytics/explanations`, {
            method: 'PUT',
            headers: systemHeaders(),
            body: JSON.stringify({
                questionId: body.questionId,
                userAnswer,
                errorCause,
                evidenceQuote: quote,
                explanationVi,
                tipVi,
                model: GROQ_CHAT_MODEL,
                source: 'ai',
            }),
        });
        if (stored.ok) explanationId = (await backendJson<any>(stored))?.id;
    } catch (err) {
        console.warn('[explain-question] cache store skipped', err);
    }

    const result: Explanation = {
        source: 'ai',
        explanationId,
        errorCause,
        evidenceQuote: quote,
        evidenceParagraph: anchor?.kind === 'passage' ? anchor.paragraph ?? null : null,
        evidenceStartMs: anchor?.kind === 'audio' ? anchor.startMs ?? null : null,
        explanationVi,
        tipVi,
    };
    return NextResponse.json(result);
}
