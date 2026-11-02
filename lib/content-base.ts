/** Shared test-builder pages live under /admin; teachers reach them under /teacher. */
export function contentBase(): '/admin' | '/teacher' {
    if (typeof window !== 'undefined' && window.location.pathname.startsWith('/teacher')) return '/teacher';
    return '/admin';
}
