import type { WordResult } from '@/lib/api/speaking';

export interface TimedWord { word: string; start: number; end: number }
const FILLERS = new Set(['um', 'uh', 'er', 'erm', 'hmm', 'ah', 'mm', 'uhm']);

export function normalizeWord(w: string) {
    return w.toLowerCase().replace(/[^a-z0-9']/g, '').replace(/^'+|'+$/g, '');
}
export function tokenize(text: string) { return text.split(/\s+/).map(normalizeWord).filter(Boolean); }

function levenshtein(a: string, b: string) {
    const m = a.length, n = b.length; const d = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
    for (let j = 1; j <= n; j++) d[0][j] = j;
    for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    return d[m][n];
}
/** Close enough to be "the same word, pronounced wrong" rather than a different word. */
export function isNearMiss(a: string, b: string) {
    if (a === b) return true;
    const L = Math.max(a.length, b.length);
    return L >= 3 && levenshtein(a, b) <= Math.max(1, Math.floor(L / 3));
}

/**
 * Sequence alignment reference ↔ heard (edit distance with substitution allowed only for near misses,
 * so a completely different word is omission + insertion). Returns one entry per reference word plus inserted ones.
 */
export function alignWords(reference: string[], heard: string[]): WordResult[] {
    const m = reference.length, n = heard.length;
    const cost: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
    for (let i = 1; i <= m; i++) cost[i][0] = i;
    for (let j = 1; j <= n; j++) cost[0][j] = j;
    for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++) {
        const same = reference[i - 1] === heard[j - 1];
        const sub = same ? 0 : isNearMiss(reference[i - 1], heard[j - 1]) ? 0.5 : 2;
        cost[i][j] = Math.min(cost[i - 1][j] + 1, cost[i][j - 1] + 1, cost[i - 1][j - 1] + sub);
    }
    const out: WordResult[] = [];
    let i = m, j = n;
    while (i > 0 || j > 0) {
        if (i > 0 && j > 0) {
            const same = reference[i - 1] === heard[j - 1];
            const sub = same ? 0 : isNearMiss(reference[i - 1], heard[j - 1]) ? 0.5 : 2;
            if (cost[i][j] === cost[i - 1][j - 1] + sub) {
                out.push(same ? { word: reference[i - 1], status: 'correct' } : { word: reference[i - 1], status: 'substituted', heard: heard[j - 1] });
                i--; j--; continue;
            }
        }
        if (i > 0 && cost[i][j] === cost[i - 1][j] + 1) { out.push({ word: reference[i - 1], status: 'omitted' }); i--; continue; }
        out.push({ word: heard[j - 1], status: 'inserted' }); j--;
    }
    return out.reverse();
}

/** Grapheme → likely sound (ARPAbet) for the sounds Vietnamese learners typically miss. */
const PATTERNS: Array<[RegExp, string]> = [
    [/^th|th$/, 'TH'], [/^(this|that|these|those|the|they|them|there|then|than|though|mother|father|brother|other|weather|whether|either|together|rather|another|with)$/, 'DH'],
    [/sh|ti(on|al)|ci(al|ous)|^su(re|gar)/, 'SH'], [/si(on)$|sure$|^(usual|measure|pleasure|vision|decision|television)/, 'ZH'],
    [/ch|tch/, 'CH'], [/^j|dge|^g[eiy]/, 'JH'], [/^z|zz|s$/, 'Z'], [/^v|v/, 'V'], [/^w|^wh/, 'W'], [/^r/, 'R'], [/l$|ll$/, 'L'], [/ng$/, 'NG'],
    [/t$|ts$/, 'T'], [/d$|ed$/, 'D'], [/k$|ck$|ks$/, 'K'], [/s$|ss$/, 'S'],
    [/ee|ea$/, 'IY'], [/ir|ur|er$|ear/, 'ER'], [/^a[^e]|a[^e]/, 'AE'], [/oo/, 'UW'], [/ow$|oa|^o[^o]/, 'OW'], [/ai|ay|a.e/, 'EY'],
];
export function inferSounds(word: string): string[] {
    const w = normalizeWord(word); const out: string[] = [];
    for (const [re, s] of PATTERNS) if (re.test(w) && !out.includes(s)) out.push(s);
    return out.slice(0, 3);
}
/** For a substituted word, which expected sounds were probably not produced (present in reference, absent in heard). */
export function soundDiff(reference: string, heard: string | null | undefined, hint: string[] = []): Array<{ expected: string; actual: string | null }> {
    const exp = new Set([...inferSounds(reference), ...hint.filter((h) => inferSounds(reference).includes(h))]);
    const got = new Set(heard ? inferSounds(heard) : []);
    const diffs: Array<{ expected: string; actual: string | null }> = [];
    for (const s of exp) if (!got.has(s)) diffs.push({ expected: s, actual: heard ? inferSounds(heard).find((g) => !exp.has(g)) ?? null : null });
    return diffs;
}

export function fluencyMetrics(words: TimedWord[], durationS: number) {
    const spoken = words.filter((w) => !FILLERS.has(normalizeWord(w.word)));
    const fillers = words.length - spoken.length;
    let pauses = 0;
    for (let i = 1; i < words.length; i++) if (words[i].start - words[i - 1].end >= 0.5) pauses++;
    const wpm = durationS > 0 && spoken.length > 0 ? Math.round((spoken.length / durationS) * 60) : null;
    return { wpm, pauses, fillers };
}

export const SOUND_LABEL: Record<string, string> = {
    TH: '/θ/', DH: '/ð/', SH: '/ʃ/', ZH: '/ʒ/', CH: '/tʃ/', JH: '/dʒ/', Z: '/z/', S: '/s/ cuối', T: '/t/ cuối', D: '/d/ cuối', K: '/k/ cuối', V: '/v/', W: '/w/', R: '/r/', L: '/l/ cuối', N: '/n/', NG: '/ŋ/',
    IY: '/iː/', IH: '/ɪ/', AE: '/æ/', EH: '/e/', AH: '/ʌ/', UW: '/uː/', UH: '/ʊ/', ER: '/ɜː/', OW: '/əʊ/', EY: '/eɪ/',
};
