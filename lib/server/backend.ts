import { NextRequest } from 'next/server';

/**
 * Server-side helpers for Next.js route handlers that talk to the API gateway.
 *
 * Two identities are available:
 *  - the signed-in user (bearer token read from the `accessToken` cookie or the
 *    incoming Authorization header) — used for anything the learner may do;
 *  - the trusted server (`INTERNAL_API_KEY` → gateway role `system`) — used only
 *    for writing AI results that a learner must never be able to forge.
 */
export const API_BASE =
    process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export function getUserToken(req: NextRequest): string | null {
    const header = req.headers.get('authorization');
    if (header?.startsWith('Bearer ')) return header.slice(7);
    return req.cookies.get('accessToken')?.value ?? null;
}

export function userHeaders(token: string | null): Record<string, string> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;
    return headers;
}

export function systemHeaders(): Record<string, string> {
    const key = process.env.INTERNAL_API_KEY;
    if (!key) {
        throw new Error('INTERNAL_API_KEY is not configured — cannot store AI results');
    }
    return { 'Content-Type': 'application/json', 'x-internal-key': key };
}

export async function backendJson<T>(res: Response): Promise<T> {
    const text = await res.text();
    if (!res.ok) {
        throw new Error(`Backend ${res.status}: ${text.slice(0, 300)}`);
    }
    if (!text) return undefined as T;
    const json = JSON.parse(text);
    return (json?.data ?? json) as T;
}

/** Store the AI band/feedback for an attempt after verifying the caller owns it. */
export async function storeAiResult(
    token: string | null,
    attemptId: string,
    payload: { bandScore?: number; aiFeedback?: string; rawScore?: number },
): Promise<void> {
    // Ownership check runs with the learner's own token — the gateway/test-service
    // reject it if the attempt belongs to someone else.
    const own = await fetch(`${API_BASE}/api/attempts/${attemptId}`, { headers: userHeaders(token) });
    if (!own.ok) throw new Error(`Attempt not accessible (${own.status})`);

    const res = await fetch(`${API_BASE}/api/attempts/${attemptId}/ai-feedback`, {
        method: 'PUT',
        headers: systemHeaders(),
        body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`Failed to store AI result (${res.status}): ${await res.text()}`);
}
