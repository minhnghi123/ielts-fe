"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BookOpen, Headphones, PenTool, Mic, Clock, HelpCircle,
  Layers, ArrowLeft, Award, CheckCircle2, PlayCircle
} from "lucide-react";
import { testsApi } from "@/lib/api/tests";
import type { Test } from "@/lib/types";
import { Breadcrumb } from "@/components/ui/breadcrumb";

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
const DURATION_MAP: Record<string, { text: string; mins: number }> = {
  reading: { text: "60 minutes", mins: 60 },
  listening: { text: "30 minutes", mins: 30 },
  writing: { text: "60 minutes", mins: 60 },
  speaking: { text: "11–15 minutes", mins: 15 },
};

const SKILL_INSTRUCTIONS: Record<string, string[]> = {
  reading: [
    "Read each passage carefully before answering questions.",
    "Manage your time: aim for 20 minutes per passage.",
    "Answers must be written exactly as they appear in the passage.",
    "Do not leave any questions unanswered — there's no penalty.",
  ],
  listening: [
    "You will hear the recording only ONCE. Listen carefully.",
    "Read the questions before the audio starts if possible.",
    "Spelling matters — check your answers before submitting.",
    "Write answers as you hear them; don't wait until the end.",
  ],
  writing: [
    "Task 1: Write at least 150 words. Task 2: Write at least 250 words.",
    "Plan your essay: introduction, body paragraphs, conclusion.",
    "Task 2 carries more marks — allocate more time to it.",
    "Proofread for grammar and vocabulary before submitting.",
  ],
  speaking: [
    "Speak clearly and at a natural pace.",
    "Extend your answers — avoid one-word responses.",
    "It's okay to take a moment to think before answering.",
    "Use a variety of vocabulary and sentence structures.",
  ],
};

export default function TestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [test, setTest] = useState<Test | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    testsApi.getTestById(id)
      .then(data => {
        setTest(data);
        setIsLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch test:", err);
        setIsLoading(false);
      });
  }, [id]);

  if (isLoading) {
    return (
      <div className="max-w-[1000px] mx-auto space-y-6 animate-pulse">
        <div className="h-48 bg-muted rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-4">
            <div className="h-8 bg-muted rounded-lg w-3/4" />
            <div className="h-4 bg-muted rounded w-full" />
            <div className="h-4 bg-muted rounded w-2/3" />
          </div>
          <div className="h-64 bg-muted rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!test) {
    return (
      <div className="text-center py-20 space-y-3">
        <span className="material-symbols-outlined text-6xl text-muted-foreground">search_off</span>
        <p className="font-medium">Test not found</p>
        <Link href="/tests"><Button variant="outline">Back to Library</Button></Link>
      </div>
    );
  }

  const config = SKILL_CONFIG[test.skill] ?? SKILL_CONFIG.reading;
  const Icon = config.icon;
  const durConfig = DURATION_MAP[test.skill] || { text: "N/A", mins: 60 };
  const instructions = SKILL_INSTRUCTIONS[test.skill] ?? [];

  const questionCount = test.sections?.reduce((acc, sec) =>
    acc + (sec.questionGroups?.reduce((qacc, group) => qacc + (group.questions?.length || 0), 0) || 0), 0
  ) || 0;
  const sectionCount = test.sections?.length || 0;

  return (
    <div className="max-w-[1000px] mx-auto space-y-6">
      <Breadcrumb items={[
        { label: 'Home', href: '/', icon: 'home' },
        { label: 'Tests', href: '/tests', icon: 'assignment' },
        { label: test.title, icon: 'description' },
      ]} />
      {/* Breadcrumb */}
      <Link
        href="/tests"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors group"
      >
        <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
        Back to Test Library
      </Link>

      {/* Hero Banner */}
      <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${config.gradient} p-8 text-white`}>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-10 -right-10 h-60 w-60 rounded-full bg-white" />
          <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-white" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-6">
          <div className="h-20 w-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0 shadow-lg">
            <Icon className="h-10 w-10 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap gap-2 mb-3">
              <span className="text-xs font-semibold bg-white/20 px-3 py-1 rounded-full">
                IELTS Academic
              </span>
              <span className="text-xs font-semibold bg-white/20 px-3 py-1 rounded-full capitalize">
                {test.skill} Test
              </span>
              {test.isMock && (
                <span className="text-xs font-semibold bg-white/20 px-3 py-1 rounded-full flex items-center gap-1">
                  <Award className="h-3 w-3" /> Mock Exam
                </span>
              )}
            </div>
            <h1 className="text-2xl md:text-3xl font-black leading-tight line-clamp-2">
              {test.title}
            </h1>
            <div className="flex flex-wrap items-center gap-4 mt-3 text-white/80 text-sm">
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                {durConfig.text}
              </span>
              {sectionCount > 0 && (
                <span className="flex items-center gap-1.5">
                  <Layers className="h-4 w-4" />
                  {sectionCount} sections
                </span>
              )}
              {questionCount > 0 && (
                <span className="flex items-center gap-1.5">
                  <HelpCircle className="h-4 w-4" />
                  {questionCount} questions
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="md:col-span-2 space-y-8">
          {/* Test Structure */}
          {test.sections && test.sections.length > 0 && (
            <div>
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Layers className="h-5 w-5 text-primary" />
                Test Structure
              </h3>
              <div className={`rounded-xl border border-border ${config.iconBg} p-4 space-y-2`}>
                {test.sections.map((sec, index) => {
                  const qCount = sec.questionGroups?.reduce((qacc, g) => qacc + (g.questions?.length || 0), 0) || 0;
                  return (
                    <div
                      key={sec.id || index}
                      className="flex items-center gap-3 bg-white/60 dark:bg-slate-800/60 rounded-lg p-3"
                    >
                      <div className={`h-7 w-7 rounded-full bg-gradient-to-br ${config.gradient} text-white flex items-center justify-center text-xs font-bold flex-shrink-0`}>
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <span className="font-medium text-sm">Section {sec.sectionOrder || index + 1}</span>
                        {qCount > 0 && (
                          <span className="text-xs text-muted-foreground ml-2">— {qCount} questions</span>
                        )}
                      </div>
                      <CheckCircle2 className="h-4 w-4 text-muted-foreground/40" />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <Separator />

          {/* Instructions */}
          <div>
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px] text-orange-500">info</span>
              Important Instructions
            </h3>
            <ul className="space-y-3">
              {instructions.map((ins, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-slate-700 dark:text-slate-300">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                  {ins}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Sticky Sidebar CTA */}
        <div className="relative">
          <div className="sticky top-24">
            <Card className="shadow-xl border-primary/10 overflow-hidden">
              <div className={`h-2 w-full bg-gradient-to-r ${config.gradient}`} />
              <CardContent className="p-6 space-y-5">
                <div>
                  <h3 className="font-bold text-lg">Ready to begin?</h3>
                  <p className="text-muted-foreground text-sm mt-1">Configure your practice session below.</p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <Clock className="h-4 w-4" /> Duration
                    </span>
                    <span className="font-semibold">{durConfig.text}</span>
                  </div>
                  <Separator />
                  {questionCount > 0 && (
                    <>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground flex items-center gap-1.5">
                          <HelpCircle className="h-4 w-4" /> Questions
                        </span>
                        <span className="font-semibold">{questionCount}</span>
                      </div>
                      <Separator />
                    </>
                  )}
                  {sectionCount > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <Layers className="h-4 w-4" /> Sections
                      </span>
                      <span className="font-semibold">{sectionCount}</span>
                    </div>
                  )}
                </div>

                <Button
                  className={`w-[calc(100%+1px)] h-12 text-base font-bold bg-gradient-to-r ${config.gradient} text-white hover:opacity-90 shadow-lg transition-all gap-2`}
                  onClick={() => router.push(`/practice/${test.id}`)}
                >
                  <PlayCircle className="h-5 w-5" />
                  Enter Practice Room
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  By starting, you agree to the test terms.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
