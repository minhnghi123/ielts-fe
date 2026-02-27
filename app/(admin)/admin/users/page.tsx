"use client";

import { useState, useEffect } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface User {
    id: string;
    email: string;
    status: string;
    role: string;
    level?: string;
    createdAt: string;
}

interface UsersPage {
    data: User[];
    total: number;
    page: number;
    totalPages: number;
    limit: number
}

const API_BASE = process.env.NEXT_PUBLIC_AUTH_SERVICE_URL || "http://localhost:5001";

export default function UsersManagementPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState("");
    const [togglingId, setTogglingId] = useState<string | null>(null);

    const fetchUsers = async (p: number, s: string) => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page: String(p), limit: "15" });
            if (s) params.set("search", s);
            const res = await fetch(`${API_BASE}/auth/users?${params}`);
            // data.data is an array of users
            const data: UsersPage = (await res.json()).data;
            setUsers(data.data ?? []);
            setTotal(data.total ?? 0);
            setTotalPages(data.totalPages ?? 1);

        } catch {
            setUsers([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchUsers(page, search);
        }, 300);
        return () => clearTimeout(timer);
    }, [page, search]);

    const toggleStatus = async (user: User) => {
        // Only implemented toggling active/banned status in backend if available
        // But for layout purposes, keeping the UI intact
        const newStatus = user.status === "active" ? "banned" : "active";
        if (!confirm(`${newStatus === "banned" ? "Ban" : "Activate"} ${user.email}?`)) return;
        setTogglingId(user.id);
        try {
            await fetch(`${API_BASE}/accounts/${user.id}/status`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus }),
            });
            fetchUsers(page, search);
        } finally {
            setTogglingId(null);
        }
    };

    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto flex flex-col gap-6 w-full">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">User Management</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">{total} accounts registered</p>
                </div>

                <div className="flex gap-3 relative">
                    <div className="relative w-full md:w-64 flex-1 min-w-48">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                            search
                        </span>
                        <input
                            type="text"
                            placeholder="Search by email..."
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                            className="pl-9 pr-4 py-2 border rounded-xl text-sm w-full focus:outline-none focus:ring-1 focus:ring-orange-500"
                        />
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="rounded-xl border overflow-hidden bg-background">
                <table className="w-full text-sm">
                    <thead className="bg-muted/50 text-muted-foreground">
                        <tr>
                            <th className="text-left px-4 py-3 font-medium">Email</th>
                            <th className="text-left px-4 py-3 font-medium">Role</th>
                            <th className="text-left px-4 py-3 font-medium">Level</th>
                            <th className="text-left px-4 py-3 font-medium">Status</th>
                            <th className="text-left px-4 py-3 font-medium">Joined</th>
                            <th className="text-right px-4 py-3 font-medium">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y relative">
                        {loading ? (
                            <tr>
                                <td colSpan={6} className="text-center py-12 text-muted-foreground">
                                    <div className="flex items-center justify-center gap-2">
                                        <span className="inline-block w-4 h-4 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
                                        Loading users...
                                    </div>
                                </td>
                            </tr>
                        ) : users.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="text-center py-16 text-muted-foreground">
                                    <span className="material-symbols-outlined text-4xl block mb-2">group_off</span>
                                    No users found matching your criteria.
                                </td>
                            </tr>
                        ) : (
                            users.map((user) => (
                                <tr key={user.id} className="hover:bg-muted/30 transition-colors">
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-8 w-8">
                                                <AvatarFallback className="bg-orange-100 text-orange-600 font-medium text-xs">
                                                    {user.email.charAt(0).toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                            <span className="font-medium text-foreground">{user.email}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${user.role === 'admin' ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
                                            }`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        {user.level ? (
                                            <span className="text-xs font-medium capitalize text-muted-foreground border px-2 py-0.5 rounded-full">
                                                {user.level}
                                            </span>
                                        ) : <span className="text-muted-foreground">-</span>}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${user.status === 'active' ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                                            }`}>
                                            {user.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground">
                                        {new Date(user.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <button
                                            onClick={() => toggleStatus(user)}
                                            disabled={togglingId === user.id}
                                            className={`text-xs px-3 py-1 rounded-lg border font-medium transition-colors disabled:opacity-50
                      ${user.status === "active"
                                                    ? "text-red-600 border-red-200 hover:bg-red-50"
                                                    : "text-green-600 border-green-200 hover:bg-green-50"}`}
                                        >
                                            {togglingId === user.id
                                                ? "…"
                                                : user.status === "active" ? "Ban" : "Activate"}
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-4">
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
