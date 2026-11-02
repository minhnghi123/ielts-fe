/** Shared test-builder pages live under /admin; teachers reach them under /teacher. */
export function contentBase(): '/admin' | '/teacher' {
    if (typeof window !== 'undefined' && window.location.pathname.startsWith('/teacher')) return '/teacher';
    return '/admin';
}

/** Leading breadcrumb items for the shared test-builder pages (Admin › Tests or Teacher › My Tests). */
export function builderBreadcrumbs(): { label: string; href: string; icon: string }[] {
    if (contentBase() === '/teacher') {
        return [
            { label: 'Teacher', href: '/teacher', icon: 'school' },
            { label: 'My Tests', href: '/teacher/tests', icon: 'assignment' },
        ];
    }
    return [
        { label: 'Admin', href: '/admin/dashboard', icon: 'admin_panel_settings' },
        { label: 'Tests', href: '/admin/tests', icon: 'assignment' },
    ];
}
