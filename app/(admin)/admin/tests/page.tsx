"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Test {
    id: string;
    skill: string;
    title: string;
    isMock: boolean;
    createdAt: string;
}

interface TestsPage {
    data: Test[];
    total: number;
    page: number;
    totalPages: number;
}

const API_BASE = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api`;

const SKILL_TABS = ["all", "reading", "listening", "writing", "speaking"];

const SKILL_COLORS: Record<string, string> = {
    reading: "bg-blue-100 text-blue-700",
    listening: "bg-purple-100 text-purple-700",
    writing: "bg-green-100 text-green-700",
    speaking: "bg-orange-100 text-orange-700",
};

export default function TestsManagementPage({ searchParams }: { searchParams?: { skill?: string } }) {
    // Determine active skill from URL or default to "all"
    // Since this is a client component, we'll try to read it initially but depend on state
    const [activeSkill, setActiveSkill] = useState("all");
    const [tests, setTests] = useState<Test[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(false);
    const [deleting, setDeleting] = useState<string | null>(null);

    // Initialize from URL search params if present (handling Next.js 13+ client side)
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const skillFromUrl = urlParams.get('skill');
        if (skillFromUrl && SKILL_TABS.includes(skillFromUrl)) {
            setActiveSkill(skillFromUrl);
        }
    }, []);

    // Update URL when switching skills without full page reload
    const handleSkillChange = (newSkill: string) => {
        setActiveSkill(newSkill);
        setPage(1);

        // Update URL to reflect current skill
        const url = new URL(window.location.href);
        if (newSkill === "all") {
            url.searchParams.delete('skill');
        } else {
            url.searchParams.set('skill', newSkill);
        }
        window.history.pushState({}, '', url);
    };

    const fetchTests = async (skill: string, p: number) => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page: String(p), limit: "12" });
            if (skill !== "all") params.set("skill", skill);
            const res = await fetch(`${API_BASE}/tests?${params}`);
            //have to add .data because the response is wrapped in data
            const data: TestsPage = (await res.json()).data;
            setTests(data.data ?? []);
            setTotal(data.total ?? 0);
            setTotalPages(data.totalPages ?? 1);
        } catch {
            setTests([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTests(activeSkill, page);
    }, [activeSkill, page]);

    const handleDelete = async (id: string, title: string) => {
        if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
        setDeleting(id);
        try {
            await fetch(`${API_BASE}/tests/${id}`, { method: "DELETE" });
            fetchTests(activeSkill, page);
        } finally {
            setDeleting(null);
        }
    };

    const addLinkHref = activeSkill === 'all'
        ? "/admin/tests/add"
        : `/admin/tests/add?skill=${activeSkill}`;

    return (
        <div className="p-6 md:p-10 max-w-[1400px] mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-800">Test Management</h1>
                    <p className="text-sm text-slate-500 mt-1">Manage and organize IELTS practice tests</p>
                </div>
                <div className="flex items-center gap-3">
                    <Link
                        href={addLinkHref}
                        className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors shadow-sm"
                    >
                        <span className="material-symbols-outlined text-[18px]">add_circle</span>
                        Add New Test
                        {activeSkill !== 'all' && <span className="text-blue-200 font-normal ml-1 border-l border-blue-500 pl-2">({activeSkill})</span>}
                    </Link>
                    <Link
                        href="/admin/tests/import"
                        className="flex items-center gap-2 px-5 py-2.5 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 transition-colors shadow-sm"
                    >
                        <span className="material-symbols-outlined text-[18px]">upload_file</span>
                        Import DOCX
                    </Link>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-8">
                {/* Left Sidebar */}
                <div className="w-full lg:w-64 flex-shrink-0">
                    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden sticky top-8">
                        <div className="p-4 border-b border-slate-100 bg-slate-50">
                            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Test Categories</h2>
                        </div>
                        <nav className="p-2 space-y-1">
                            {SKILL_TABS.map((tab) => {
                                const isActive = activeSkill === tab;
                                return (
                                    <button
                                        key={tab}
                                        onClick={() => handleSkillChange(tab)}
                                        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all ${isActive
                                            ? "bg-blue-50 text-blue-700 font-semibold"
                                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                            }`}
                                    >
                                        <span className="capitalize">{tab}</span>
                                        {isActive && (
                                            <span className="bg-blue-200 text-blue-800 text-xs px-2 py-0.5 rounded-full font-bold">
                                                Active
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </nav>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <h2 className="font-semibold text-slate-800 capitalize">
                                {activeSkill === 'all' ? 'All Tests' : `${activeSkill} Tests`}
                                <span className="ml-3 text-sm font-normal text-slate-500 bg-slate-200/50 px-2.5 py-1 rounded-full">{total} items</span>
                            </h2>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50/80 text-slate-500 border-b border-slate-200">
                                    <tr>
                                        <th className="text-left px-6 py-4 font-semibold">Title</th>
                                        <th className="text-left px-6 py-4 font-semibold">Skill</th>
                                        <th className="text-left px-6 py-4 font-semibold">Type</th>
                                        <th className="text-left px-6 py-4 font-semibold">Created</th>
                                        <th className="text-right px-6 py-4 font-semibold">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={5} className="text-center py-16">
                                                <div className="flex flex-col items-center justify-center gap-3 text-slate-400">
                                                    <span className="inline-block w-6 h-6 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                                                    <span>Loading tests...</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : tests.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="text-center py-20 text-slate-500">
                                                <div className="flex flex-col items-center justify-center gap-3">
                                                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-2">
                                                        <span className="material-symbols-outlined text-3xl text-slate-400">inbox</span>
                                                    </div>
                                                    <p className="font-medium text-slate-700">No tests found for this category</p>
                                                    <Link
                                                        href={addLinkHref}
                                                        className="text-blue-600 font-medium hover:underline text-sm"
                                                    >
                                                        Create your first test
                                                    </Link>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        tests.map((test) => (
                                            <tr key={test.id} className="hover:bg-slate-50/80 transition-colors group">
                                                <td className="px-6 py-4">
                                                    <Link href={`/admin/tests/${test.id}`} className="font-semibold text-slate-800 group-hover:text-blue-600 transition-colors">
                                                        {test.title}
                                                    </Link>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wide ${SKILL_COLORS[test.skill] ?? "bg-slate-100 text-slate-600"}`}>
                                                        {test.skill}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${test.isMock ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>
                                                        {test.isMock ? "MOCK" : "PRACTICE"}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-slate-500">
                                                    {new Date(test.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Link
                                                            href={`/admin/tests/${test.id}`}
                                                            className="p-2 rounded-lg bg-white shadow-sm border border-slate-200 hover:border-blue-300 hover:text-blue-600 transition-all text-slate-500"
                                                            title="Edit"
                                                        >
                                                            <span className="material-symbols-outlined text-[18px] block">edit</span>
                                                        </Link>
                                                        <button
                                                            onClick={() => handleDelete(test.id, test.title)}
                                                            disabled={deleting === test.id}
                                                            className="p-2 rounded-lg bg-white shadow-sm border border-slate-200 hover:border-red-300 hover:text-red-600 transition-all text-slate-500 disabled:opacity-50"
                                                            title="Delete"
                                                        >
                                                            {deleting === test.id
                                                                ? <span className="inline-block w-[18px] h-[18px] border-2 border-red-300 border-t-red-600 rounded-full animate-spin block" />
                                                                : <span className="material-symbols-outlined text-[18px] block">delete</span>}
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-sm">
                                <span className="text-slate-500 font-medium">
                                    Page {page} of {totalPages}
                                </span>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                                        disabled={page === 1}
                                        className="px-4 py-2 bg-white border border-slate-200 rounded-lg font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50 transition-colors"
                                    >
                                        Previous
                                    </button>
                                    <button
                                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                        disabled={page === totalPages}
                                        className="px-4 py-2 bg-white border border-slate-200 rounded-lg font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50 transition-colors"
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
