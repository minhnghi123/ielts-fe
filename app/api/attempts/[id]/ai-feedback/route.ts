import { NextRequest, NextResponse } from 'next/server';
import { getUserToken, storeAiResult } from '@/lib/server/backend';

/**
 * Speaking/Writing bands are produced by AI on the server and persisted here.
 * The browser never sends a band straight to the gateway (it would be rejected);
 * instead this route checks the caller owns the attempt and writes with the
 * internal key. Bands are clamped to the IELTS 0–9 / 0.5 scale.
 */
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const token = getUserToken(req);
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = (await req.json().catch(() => ({}))) as {
        bandScore?: number;
        aiFeedback?: string;
    };

    const payload: { bandScore?: number; aiFeedback?: string } = {};
    if (typeof body.bandScore === 'number' && Number.isFinite(body.bandScore)) {
        payload.bandScore = Math.min(9, Math.max(0, Math.round(body.bandScore * 2) / 2));
    }
    if (typeof body.aiFeedback === 'string') payload.aiFeedback = body.aiFeedback.slice(0, 20_000);
    if (Object.keys(payload).length === 0) {
        return NextResponse.json({ error: 'Nothing to store' }, { status: 400 });
    }

    try {
        await storeAiResult(token, id, payload);
        return new NextResponse(null, { status: 204 });
    } catch (err) {
        return NextResponse.json(
            { error: err instanceof Error ? err.message : 'Failed to store AI result' },
            { status: 502 },
        );
    }
}
