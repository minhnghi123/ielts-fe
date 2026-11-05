'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  BookOpen,
  Headphones,
  PenTool,
  Mic,
  Search,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import Link from 'next/link';
import { testsApi } from '@/lib/api/tests';
import type { Test } from '@/lib/types';
import { Breadcrumb } from '@/components/ui/breadcrumb';

const DIFFICULTY_VI: Record<string, string> = { easy: 'Dễ', medium: 'Trung bình', hard: 'Khó' };

const SKILL_CONFIG: Record<string, {
  icon: React.ElementType;
  label: string;
  gradient: string;
  badge: string;
  iconBg: string;
}> = {
  reading: {
    icon: BookOpen,
    label: 'Reading',
    gradient: 'from-emerald-500 to-teal-600',
    badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
    iconBg: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400',
  },
  listening: {
    icon: Headphones,
    label: 'Listening',
    gradient: 'from-blue-500 to-indigo-600',
    badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    iconBg: 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400',
  },
  writing: {
    icon: PenTool,
    label: 'Writing',
    gradient: 'from-amber-500 to-orange-500',
    badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    iconBg: 'bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400',
  },
  speaking: {
    icon: Mic,
    label: 'Speaking',
    gradient: 'from-violet-500 to-purple-600',
    badge: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
    iconBg: 'bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400',
  },
};

const DURATION_MAP: Record<string, string> = {
  reading: '60 phút',
  listening: '30 phút',
  writing: '60 phút',
  speaking: '15 phút',
};

const SKILLS = ['all', 'reading', 'listening', 'writing', 'speaking'] as const;
const DIFFICULTIES = ['all', 'easy', 'medium', 'hard'] as const;
export default function TestsPage() {
  const [tests, setTests] = useState<Test[]>([]);
  const [skill, setSkill] = useState<string>('all');
  const [difficulty, setDifficulty] = useState<string>('all');
  const [search, setSearch] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const LIMIT: number = 12;

  useEffect(() => {
    const t = setTimeout(fetchTests, search ? 300 : 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skill, difficulty, page, search]);

  async function fetchTests() {
    setLoading(true);
    setError(null);
    try {
      const result = await testsApi.getTests({
        skill: skill === 'all' ? undefined : skill,
        difficulty: difficulty === 'all' ? undefined : difficulty,
        search: search.trim() || undefined,
        page,
        limit: LIMIT,
      });
      setTests(result.data);
      setTotal(result.total);
      setTotalPages(result.totalPages);
    } catch {
      setError('Failed to load tests. Please make sure the test-service is running.');
      setTests([]);
    } finally {
      setLoading(false);
    }
  }

  const filtered = tests;

  return (
    <motion.div
      className="space-y-8"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: 'easeOut' }}
    >
      <Breadcrumb items={[
        { label: 'Home', href: '/', icon: 'home' },
        { label: 'Tests', icon: 'assignment' },
      ]} />

      {/* Title row: one question per screen — "luyện gì hôm nay?" */}
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Luyện tập</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {total > 0 ? `${total} đề thi` : 'Chưa có đề nào'} · chọn kỹ năng rồi bắt đầu, hoặc luyện theo dạng câu ở Sổ lỗi.
        </p>
      </header>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm đề theo tên…"
            className="pl-9 h-11 bg-card"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            aria-label="Tìm đề"
          />
        </div>

        {/* Difficulty */}
        <div className="flex gap-1 rounded-full border border-border bg-card p-1" role="group" aria-label="Độ khó">
          {DIFFICULTIES.map((d) => (
            <button
              key={d}
              onClick={() => { setDifficulty(d); setPage(1); }}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold capitalize transition-colors ${difficulty === d
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'}`}
            >
              {d === 'all' ? 'Mọi độ khó' : DIFFICULTY_VI[d] ?? d}
            </button>
          ))}
        </div>

        {/* Skill Filter Pills */}
        <div className="flex flex-wrap gap-2">
          {SKILLS.map((s) => {
            const config = SKILL_CONFIG[s];
            const Icon = config?.icon;
            const isActive = skill === s;
            return (
              <button
                key={s}
                onClick={() => { setSkill(s); setPage(1); }}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border ${isActive
                  ? 'bg-primary/10 text-primary border-primary/20'
                  : 'bg-card text-muted-foreground border-border hover:border-primary/30 hover:text-foreground'
                  }`}
              >
                {Icon && <Icon className="h-3.5 w-3.5" />}
                {s === 'all' ? 'Tất cả' : config.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Bảng đề */}
      <div className="overflow-x-auto rounded-md bg-muted">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-muted-foreground">
              <th className="px-4 py-3 font-medium">Đề</th>
              <th className="px-4 py-3 font-medium">Kỹ năng</th>
              <th className="px-4 py-3 font-medium text-right hidden sm:table-cell">Câu</th>
              <th className="px-4 py-3 font-medium text-right hidden sm:table-cell">Thời gian</th>
              <th className="px-4 py-3 font-medium hidden md:table-cell">Độ khó</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan={6} className="px-4 py-3"><div className="h-5 w-2/3 animate-pulse rounded bg-border" /></td>
                </tr>
              ))
            ) : error ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center">
                  <p className="text-destructive">{error}</p>
                  <Button onClick={fetchTests} variant="outline" size="sm" className="mt-3">Thử lại</Button>
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                  Không có đề nào khớp. Thử kỹ năng khác hoặc từ khoá khác.
                </td>
              </tr>
            ) : (
              filtered.map((test) => {
                const config = SKILL_CONFIG[test.skill] ?? SKILL_CONFIG.reading;
                const questionCount = test.sections?.reduce((acc, sec) =>
                  acc + (sec.questionGroups?.reduce((qacc, group) => qacc + (group.questions?.length || 0), 0) || 0), 0
                ) || 0;
                const duration = test.durationMinutes ? `${test.durationMinutes} phút` : DURATION_MAP[test.skill] || '—';
                return (
                  <tr key={test.id} className="hover:bg-accent">
                    <td className="px-4 py-3">
                      <Link href={`/tests/${test.id}`} className="font-medium hover:text-primary">{test.title}</Link>
                      {test.isMock && <span className="ml-2 text-xs text-muted-foreground">đề thi thử</span>}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{config.label}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-muted-foreground hidden sm:table-cell">{questionCount > 0 ? questionCount : '—'}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-muted-foreground hidden sm:table-cell">{duration}</td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{test.difficulty ? DIFFICULTY_VI[test.difficulty] ?? test.difficulty : '—'}</td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/tests/${test.id}`} className="text-sm text-primary hover:underline whitespace-nowrap">Xem đề</Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {!loading && !error && totalPages > 1 && (
        <div className="flex justify-center items-center gap-3 pt-4">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="gap-1"
          >
            <ChevronLeft className="h-4 w-4" />
            Trước
          </Button>
          <span className="text-sm text-muted-foreground px-2">
            Trang <strong>{page}</strong>/<strong>{totalPages}</strong>
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="gap-1"
          >
            Sau
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </motion.div>
  );
}
