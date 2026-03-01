"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator"; // Cần cài: npx shadcn@latest add separator
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { testsApi } from "@/lib/api/tests";
import type { Test } from "@/lib/types";
export default function TestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [test, setTest] = useState<Test | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [duration, setDuration] = useState("full");

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
    return <div className="text-center py-20">Loading test details...</div>;
  }

  if (!test) {
    return <div className="text-center py-20">Test not found</div>;
  }

  const durationMap: Record<string, string> = {
    reading: "60 mins",
    listening: "30 mins",
    writing: "60 mins",
    speaking: "11-14 mins",
  };

  const testInfo = {
    id: test.id,
    title: test.title,
    category: test.skill.charAt(0).toUpperCase() + test.skill.slice(1),
    difficulty: test.isMock ? "Mock Test" : "Practice",
    duration: durationMap[test.skill] || "N/A",
    questions: test.sections?.reduce((acc, sec) =>
      acc + (sec.groups?.reduce((qacc, group) => qacc + (group.questions?.length || 0), 0) || 0)
      , 0) || 0,
    parts: test.sections?.map(sec => `Section ${sec.sectionOrder}`) || [],
    description: `This is a practice test for IELTS ${test.skill.charAt(0).toUpperCase() + test.skill.slice(1)}.`,
    instructions: [
      "Read the questions carefully.",
      "Manage your time effectively.",
      "Check your answers at the end.",
    ],
  };

  return (
    <div className="max-w-[1000px] mx-auto space-y-6">
      {/* Breadcrumb / Back Button */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link
          href="/tests"
          className="hover:text-primary flex items-center gap-1"
        >
          <span className="material-symbols-outlined text-[16px]">
            arrow_back
          </span>
          Back to Library
        </Link>
        <span>/</span>
        <span className="text-foreground font-medium">{testInfo.category}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Main Content (Left - 2 Cols) */}
        <div className="md:col-span-2 space-y-8">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300">
                {testInfo.category}
              </Badge>
              <Badge
                variant="outline"
                className="text-yellow-600 border-yellow-200 bg-yellow-50"
              >
                {testInfo.difficulty}
              </Badge>
            </div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white leading-tight">
              {testInfo.title}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-4 text-lg leading-relaxed">
              {testInfo.description}
            </p>
          </div>

          <Separator />

          {/* Test Structure */}
          <div>
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">
                toc
              </span>
              Test Structure
            </h3>
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-6 border border-slate-100 dark:border-slate-800">
              <ul className="space-y-3">
                {testInfo.parts.map((part, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                      {index + 1}
                    </div>
                    <span className="text-slate-700 dark:text-slate-300 font-medium">
                      {part}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Instructions */}
          <div>
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-orange-500">
                info
              </span>
              Important Instructions
            </h3>
            <ul className="list-disc list-inside space-y-2 text-slate-600 dark:text-slate-400 ml-2">
              {testInfo.instructions.map((ins, i) => (
                <li key={i}>{ins}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Sidebar (Right - 1 Col) - Sticky */}
        <div className="relative">
          <div className="sticky top-24">
            <Card className="shadow-lg border-primary/10 overflow-hidden">
              <div className="h-2 bg-primary w-full"></div>
              <CardHeader>
                <CardTitle>Ready to start?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <span className="material-symbols-outlined text-[18px]">
                        schedule
                      </span>{" "}
                      Duration
                    </span>
                    <span className="font-bold">{testInfo.duration}</span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <span className="material-symbols-outlined text-[18px]">
                        help
                      </span>{" "}
                      Questions
                    </span>
                    <span className="font-bold">{testInfo.questions}</span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <span className="material-symbols-outlined text-[18px]">
                        group
                      </span>{" "}
                      Attempts
                    </span>
                    <span className="font-bold">1,234 users</span>
                  </div>
                </div>

                <div className="space-y-3 mt-4">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Practice Mode / Duration
                  </label>
                  <Select value={duration} onValueChange={setDuration}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select duration" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full">Full Duration ({testInfo.duration})</SelectItem>
                      <SelectItem value="10">10 minutes (Quick)</SelectItem>
                      <SelectItem value="20">20 minutes</SelectItem>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="untimed">Untimed Mode</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Nút Start - Dẫn sang trang làm bài thi (sẽ làm ở bước sau) */}
                <Button
                  className="w-full h-12 text-base font-bold shadow-blue-500/20 shadow-md mt-4"
                  onClick={() => {
                    router.push(`/practice/${testInfo.id}?duration=${duration}`);
                  }}
                >
                  Start Test Now
                </Button>

                <p className="text-xs text-center text-muted-foreground mt-2">
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
