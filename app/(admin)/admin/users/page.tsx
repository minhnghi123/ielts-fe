"use client";

import { useState, useEffect } from "react";

const API_BASE = process.env.NEXT_PUBLIC_AUTH_SERVICE_URL || "http://localhost:5001";

interface User {
    id: string;
    email: string;
    status: string;
    createdAt: string;
}

export default function UsersManagementPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [togglingId, setTogglingId] = useState<string | null>(null);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/accounts`);
            const data = await res.json();
            setUsers(Array.isArray(data) ? data : data.data ?? []);
        } catch {
            setUsers([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchUsers(); }, []);

    const toggleStatus = async (user: User) => {
        const newStatus = user.status === "active" ? "banned" : "active";
        if (!confirm(`${newStatus === "banned" ? "Ban" : "Activate"} ${user.email}?`)) return;
        setTogglingId(user.id);
        try {
            await fetch(`${API_BASE}/accounts/${user.id}/status`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus }),
            });
            fetchUsers();
        } finally {
            setTogglingId(null);
        }
    };

    const filtered = users.filter((u) => {
        const matchSearch = u.email.toLowerCase().includes(search.toLowerCase());
        const matchStatus = statusFilter === "all" || u.status === statusFilter;
        return matchSearch && matchStatus;
    });

    return (
        <div className="p-6 md:p-10 max-w-6xl mx-auto flex flex-col gap-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold tracking-tight">User Management</h1>
                <p className="text-sm text-muted-foreground mt-0.5">{users.length} accounts registered</p>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-3 flex-wrap">
                <div className="relative flex-1 min-w-48">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">search</span>
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search by email…"
                        className="w-full pl-9 pr-4 py-2 border rounded-xl text-sm bg-background focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                </div>
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="border rounded-xl px-3 py-2 text-sm bg-background"
                >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="banned">Banned</option>
                </select>
            </div>

            {/* Table */}
            <div className="rounded-xl border overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-muted/50 text-muted-foreground">
                        <tr>
                            <th className="text-left px-4 py-3 font-medium">Email</th>
                            <th className="text-left px-4 py-3 font-medium">Status</th>
                            <th className="text-left px-4 py-3 font-medium">Joined</th>
                            <th className="text-right px-4 py-3 font-medium">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {loading ? (
                            <tr>
                                <td colSpan={4} className="text-center py-12 text-muted-foreground">
                                    <div className="flex items-center justify-center gap-2">
                                        <span className="inline-block w-4 h-4 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
                                        Loading…
                                    </div>
                                </td>
                            </tr>
                        ) : filtered.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="text-center py-16 text-muted-foreground">
                                    <span className="material-symbols-outlined text-4xl block mb-2">group_off</span>
                                    No users found
                                </td>
                            </tr>
                        ) : (
                            filtered.map((user) => (
                                <tr key={user.id} className="hover:bg-muted/30 transition-colors">
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <div className="h-8 w-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-semibold text-sm">
                                                {user.email.charAt(0).toUpperCase()}
                                            </div>
                                            <span>{user.email}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full
                      ${user.status === "active" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
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
        </div>
    );
}
