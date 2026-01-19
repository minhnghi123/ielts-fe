"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator"; // Cần cài: npx shadcn@latest add separator

export default function TestDetailPage({ params }: { params: { id: string } }) {
  // Mock Data: Trong thực tế, bạn sẽ dùng params.id để fetch API
  const testInfo = {
    id: params.id,
    title: "Cambridge IELTS 18 - Test 1: Listening",
    category: "Listening",
    difficulty: "Medium",
    duration: "30 mins",
    questions: 40,
    parts: [
      "Part 1: Social Conversation (10 questions)",
      "Part 2: Monologue - Everyday Context (10 questions)",
      "Part 3: Academic Discussion (10 questions)",
      "Part 4: Academic Monologue (10 questions)",
    ],
    description:
      "This practice test is based on the Cambridge IELTS 18 Academic module. It focuses on listening skills required for university admission.",
    instructions: [
      "Listen to the audio once only.",
      "Read the questions carefully before listening.",
      "Write your answers on the answer sheet.",
      "Check your spelling and grammar.",
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

                {/* Nút Start - Dẫn sang trang làm bài thi (sẽ làm ở bước sau) */}
                <Link
                  href={`/practice/${testInfo.id}`}
                  className="block w-full"
                >
                  <Button className="w-full h-12 text-base font-bold shadow-blue-500/20 shadow-md">
                    Start Test Now
                  </Button>
                </Link>

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
