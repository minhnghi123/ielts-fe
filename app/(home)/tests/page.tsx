'use client';

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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

const SKILL_ICONS = {
  reading: BookOpen,
  listening: Headphones,
  writing: PenTool,
  speaking: Mic,
};

const SKILL_COLORS: Record<string, string> = {
  reading: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  listening: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
  writing: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  speaking: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
};

const SKILLS = ['all', 'reading', 'listening', 'writing', 'speaking'] as const;

export default function TestsPage() {
  const [tests, setTests] = useState<Test[]>([]);
  const [skill, setSkill] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const LIMIT = 12;

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
    ? tests.filter((t) =>
      t.title.toLowerCase().includes(search.toLowerCase()),
    )
    : tests;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Test Library</h1>
        <p className="text-muted-foreground mt-1">
          Choose a practice test to start improving your IELTS score.
        </p>
      </div>

      <div className="flex gap-3 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tests..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <Tabs
        value={skill}
        onValueChange={(v) => {
          setSkill(v);
          setPage(1);
        }}
      >
        <TabsList>
          {SKILLS.map((s) => (
            <TabsTrigger key={s} value={s} className="capitalize">
              {s === 'all' ? 'All Tests' : s}
            </TabsTrigger>
          ))}
        </TabsList>

        {SKILLS.map((s) => (
          <TabsContent key={s} value={s} className="mt-4">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader>
                      <div className="h-4 bg-muted rounded w-3/4" />
                      <div className="h-3 bg-muted rounded w-1/2 mt-2" />
                    </CardHeader>
                    <CardContent>
                      <div className="h-8 bg-muted rounded" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : error ? (
              <div className="text-center py-12 text-muted-foreground">
                <p className="text-destructive">{error}</p>
                <Button onClick={fetchTests} variant="outline" className="mt-4">
                  Retry
                </Button>
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>No tests found.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.map((test) => {
                  const Icon = SKILL_ICONS[test.skill];
                  return (
                    <Card
                      key={test.id}
                      className="hover:shadow-md transition-shadow"
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <Badge className={SKILL_COLORS[test.skill]}>
                            <Icon className="h-3 w-3 mr-1" />
                            {test.skill.charAt(0).toUpperCase() +
                              test.skill.slice(1)}
                          </Badge>
                          {test.isMock && (
                            <Badge variant="secondary">Mock Test</Badge>
                          )}
                        </div>
                        <CardTitle className="mt-2 text-base leading-snug">
                          {test.title}
                        </CardTitle>
                        <CardDescription>
                          {new Date(test.createdAt).toLocaleDateString()}
                        </CardDescription>
                      </CardHeader>
                      <CardFooter>
                        <Link
                          href={`/practice/${test.id}?skill=${test.skill}`}
                          className="w-full"
                        >
                          <Button className="w-full" size="sm">
                            Start Practice
                          </Button>
                        </Link>
                      </CardFooter>
                    </Card>
                  );
                })}
              </div>
            )}

            {!loading && !error && totalPages > 1 && (
              <div className="flex justify-center items-center gap-3 mt-6">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {page} of {totalPages} ({total} tests)
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
