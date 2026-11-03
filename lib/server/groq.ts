/**
 * Shared Groq chat-completion settings.
 *
 * Groq retires models over time (llama-3.x is no longer available on every
 * account), so the model is configurable and defaults to the current
 * general-purpose model. gpt-oss models spend tokens on hidden reasoning;
 * keep that low so the visible JSON answer is not truncated.
 */
export const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
export const GROQ_CHAT_MODEL = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';

export function groqModelOptions(model: string = GROQ_CHAT_MODEL): Record<string, unknown> {
    return /gpt-oss|qwen/i.test(model) ? { reasoning_effort: 'low' } : {};
}

/** Throw a helpful error when the model stopped before finishing its answer. */
export function assertGroqFinished(choice: { finish_reason?: string } | undefined) {
    if (choice?.finish_reason === 'length') {
        throw new Error('AI response was cut off (token limit). Please try again.');
    }
}
