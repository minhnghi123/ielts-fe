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

const API_BASE = process.env.NEXT_PUBLIC_TEST_SERVICE_URL || "http://localhost:3001";

const SKILL_TABS = ["all", "reading", "listening", "writing", "speaking"];

const SKILL_COLORS: Record<string, string> = {
    reading: "bg-blue-100 text-blue-700",
    listening: "bg-purple-100 text-purple-700",
    writing: "bg-green-100 text-green-700",
    speaking: "bg-orange-100 text-orange-700",
};

export default function TestsManagementPage() {
    const [activeSkill, setActiveSkill] = useState("all");
    const [tests, setTests] = useState<Test[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(false);
    const [deleting, setDeleting] = useState<string | null>(null);

    const fetchTests = async (skill: string, p: number) => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page: String(p), limit: "12" });
            if (skill !== "all") params.set("skill", skill);
            const res = await fetch(`${API_BASE}/tests?${params}`);
            const data: TestsPage = await res.json();
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

    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto flex flex-col gap-6">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Test Management</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">{total} tests total</p>
                </div>
                <div className="flex items-center gap-3">
                    <Link
                        href="/admin/tests/add"
                        className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors text-sm"
                    >
                        <span className="material-symbols-outlined text-sm">add_circle</span>
                        Add Test
                    </Link>
                    <Link
                        href="/admin/tests/import"
                        className="flex items-center gap-2 px-4 py-2.5 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 transition-colors text-sm"
                    >
                        <span className="material-symbols-outlined text-sm">upload_file</span>
                        Import DOCX
                    </Link>
                </div>
            </div>

            {/* Skill tabs */}
            <div className="flex gap-1 border-b">
                {SKILL_TABS.map((tab) => (
                    <button
                        key={tab}
                        onClick={() => { setActiveSkill(tab); setPage(1); }}
                        className={`px-4 py-2.5 text-sm font-medium capitalize border-b-2 transition-colors -mb-px
              ${activeSkill === tab
                                ? "border-orange-500 text-orange-600"
                                : "border-transparent text-muted-foreground hover:text-foreground"}`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Table */}
            <div className="rounded-xl border overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-muted/50 text-muted-foreground">
                        <tr>
                            <th className="text-left px-4 py-3 font-medium">Title</th>
                            <th className="text-left px-4 py-3 font-medium">Skill</th>
                            <th className="text-left px-4 py-3 font-medium">Type</th>
                            <th className="text-left px-4 py-3 font-medium">Created</th>
                            <th className="text-right px-4 py-3 font-medium">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {loading ? (
                            <tr>
                                <td colSpan={5} className="text-center py-12 text-muted-foreground">
                                    <div className="flex items-center justify-center gap-2">
                                        <span className="inline-block w-4 h-4 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
                                        Loading…
                                    </div>
                                </td>
                            </tr>
                        ) : tests.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="text-center py-16 text-muted-foreground">
                                    <span className="material-symbols-outlined text-4xl block mb-2">inbox</span>
                                    No tests found.{" "}
                                    <Link href="/admin/tests/import" className="text-orange-500 hover:underline">
                                        Import one
                                    </Link>
                                </td>
                            </tr>
                        ) : (
                            tests.map((test) => (
                                <tr key={test.id} className="hover:bg-muted/30 transition-colors">
                                    <td className="px-4 py-3">
                                        <Link href={`/admin/tests/${test.id}`} className="font-medium hover:text-orange-500 transition-colors">
                                            {test.title}
                                        </Link>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${SKILL_COLORS[test.skill] ?? "bg-gray-100 text-gray-600"}`}>
                                            {test.skill}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`text-xs px-2 py-0.5 rounded-full ${test.isMock ? "bg-yellow-100 text-yellow-700" : "bg-gray-100 text-gray-600"}`}>
                                            {test.isMock ? "Mock" : "Practice"}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground">
                                        {new Date(test.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center justify-end gap-2">
                                            <Link
                                                href={`/admin/tests/${test.id}`}
                                                className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                                                title="Edit"
                                            >
                                                <span className="material-symbols-outlined text-sm">edit</span>
                                            </Link>
                                            <button
                                                onClick={() => handleDelete(test.id, test.title)}
                                                disabled={deleting === test.id}
                                                className="p-1.5 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-600 transition-colors disabled:opacity-50"
                                                title="Delete"
                                            >
                                                {deleting === test.id
                                                    ? <span className="inline-block w-4 h-4 border-2 border-red-300 border-t-red-600 rounded-full animate-spin" />
                                                    : <span className="material-symbols-outlined text-sm">delete</span>}
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
                <div className="flex items-center justify-center gap-2">
                    <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="px-3 py-1.5 rounded-lg border text-sm hover:bg-muted disabled:opacity-40 transition-colors"
                    >
                        ← Prev
                    </button>
                    <span className="text-sm text-muted-foreground">
                        Page {page} of {totalPages}
                    </span>
                    <button
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="px-3 py-1.5 rounded-lg border text-sm hover:bg-muted disabled:opacity-40 transition-colors"
                    >
                        Next →
                    </button>
                </div>
            )}
        </div>
    );
}
