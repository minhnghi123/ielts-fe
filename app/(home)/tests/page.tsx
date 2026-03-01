'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  BookOpen,
  Headphones,
  PenTool,
  Mic,
  Search,
  ChevronLeft,
  ChevronRight,
  Clock,
  HelpCircle,
  Layers,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';
import { testsApi } from '@/lib/api/tests';
import type { Test } from '@/lib/types';

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
    gradient: 'from-blue-500 to-indigo-600',
    badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    iconBg: 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400',
  },
  listening: {
    icon: Headphones,
    label: 'Listening',
    gradient: 'from-purple-500 to-violet-600',
    badge: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
    iconBg: 'bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400',
  },
  writing: {
    icon: PenTool,
    label: 'Writing',
    gradient: 'from-emerald-500 to-teal-600',
    badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
    iconBg: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400',
  },
  speaking: {
    icon: Mic,
    label: 'Speaking',
    gradient: 'from-orange-500 to-rose-500',
    badge: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
    iconBg: 'bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400',
  },
};

const DURATION_MAP: Record<string, string> = {
  reading: '60 min',
  listening: '30 min',
  writing: '60 min',
  speaking: '15 min',
};

const SKILLS = ['all', 'reading', 'listening', 'writing', 'speaking'] as const;

export default function TestsPage() {
  const [tests, setTests] = useState<Test[]>([]);
  const [skill, setSkill] = useState<string>('all');
  const [search, setSearch] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const LIMIT: number = 12;

  useEffect(() => {
    fetchTests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skill, page]);

  async function fetchTests() {
    setLoading(true);
    setError(null);
    try {
      const result = await testsApi.getTests({
        skill: skill === 'all' ? undefined : skill,
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

  const filtered = search.trim()
    ? tests.filter((t) => t.title.toLowerCase().includes(search.toLowerCase()))
    : tests;

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-blue-600 to-indigo-700 p-8 text-white">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-10 -right-10 h-60 w-60 rounded-full bg-white" />
          <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-white" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-5 w-5 text-yellow-300" />
            <span className="text-blue-200 text-sm font-medium">IELTS Practice Hub</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black mb-2">Test Library</h1>
          <p className="text-blue-100 text-lg">
            {total > 0 ? `${total} tests available` : 'Explore our collection'} — choose a skill and start practicing today.
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tests by name..."
            className="pl-9 h-11 bg-card"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
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
                  ? 'bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20'
                  : 'bg-card text-muted-foreground border-border hover:border-primary/50 hover:text-foreground'
                  }`}
              >
                {Icon && <Icon className="h-3.5 w-3.5" />}
                {s === 'all' ? 'All Tests' : config.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-card rounded-2xl border border-border animate-pulse overflow-hidden">
              <div className="h-2 bg-muted w-full" />
              <div className="p-6 space-y-3">
                <div className="h-5 bg-muted rounded-lg w-3/4" />
                <div className="h-4 bg-muted rounded-lg w-1/2" />
                <div className="h-10 bg-muted rounded-lg mt-4" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-16 space-y-4">
          <div className="h-20 w-20 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
            <span className="material-symbols-outlined text-destructive text-4xl">error</span>
          </div>
          <p className="text-destructive font-medium">{error}</p>
          <Button onClick={fetchTests} variant="outline">Retry</Button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mx-auto">
            <span className="material-symbols-outlined text-muted-foreground text-4xl">search_off</span>
          </div>
          <p className="font-medium">No tests found</p>
          <p className="text-muted-foreground text-sm">Try a different skill or search term</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((test) => {
            const config = SKILL_CONFIG[test.skill] ?? SKILL_CONFIG.reading;
            const Icon = config.icon;
            const questionCount = test.sections?.reduce((acc, sec) =>
              acc + (sec.questionGroups?.reduce((qacc, group) => qacc + (group.questions?.length || 0), 0) || 0), 0
            ) || 0;
            const sectionCount = test.sections?.length || 0;

            return (
              <div
                key={test.id}
                className="group bg-card rounded-2xl border border-border hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 overflow-hidden flex flex-col"
              >
                {/* Top gradient stripe */}
                <div className={`h-1.5 w-full bg-gradient-to-r ${config.gradient}`} />

                <div className="p-6 flex flex-col flex-1 gap-4">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className={`h-11 w-11 rounded-xl flex items-center justify-center flex-shrink-0 ${config.iconBg} group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex flex-wrap gap-1.5 ml-auto">
                      <Badge className={`text-xs ${config.badge} border-none`}>
                        {config.label}
                      </Badge>
                      {test.isMock && (
                        <Badge variant="secondary" className="text-xs">Mock</Badge>
                      )}
                    </div>
                  </div>

                  {/* Title */}
                  <div className="flex-1">
                    <h3 className="font-bold text-base leading-snug line-clamp-2 group-hover:text-primary transition-colors duration-200">
                      {test.title}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      Added {new Date(test.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {DURATION_MAP[test.skill] || 'N/A'}
                    </span>
                    {sectionCount > 0 && (
                      <span className="flex items-center gap-1">
                        <Layers className="h-3.5 w-3.5" />
                        {sectionCount} sections
                      </span>
                    )}
                    {questionCount > 0 && (
                      <span className="flex items-center gap-1">
                        <HelpCircle className="h-3.5 w-3.5" />
                        {questionCount} questions
                      </span>
                    )}
                  </div>

                  {/* CTA */}
                  <Link href={`/tests/${test.id}`} className="block mt-auto">
                    <Button
                      className={`w-full bg-gradient-to-r ${config.gradient} text-white hover:opacity-90 transition-opacity font-semibold shadow-md`}
                      size="sm"
                    >
                      View Test
                    </Button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

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
            Previous
          </Button>
          <span className="text-sm text-muted-foreground px-2">
            Page <strong>{page}</strong> of <strong>{totalPages}</strong>
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="gap-1"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
