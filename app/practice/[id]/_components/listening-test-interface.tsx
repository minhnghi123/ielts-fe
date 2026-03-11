import { useState, useRef, useMemo } from "react";
import type { Test, Question, QuestionGroup } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { AlertTriangle } from "lucide-react";
import { SplitTestLayout } from "./split-test-layout";
import { QuestionsPanel } from "./questions-panel";
import { QuestionMinimap } from "./question-minimap";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function ListeningTestInterface({
  testId,
  test,
  onAnswerUpdate,
  onFinish,
}: {
  testId: string;
  test?: Test | null;
  onAnswerUpdate?: (answers: Record<string, string>) => void;
  onFinish: (answers: Record<string, string>) => void;
}) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(600);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Gather all questions from all sections
  const allQuestions = useMemo(() => {
    return (
      test?.sections?.flatMap(
        (sec) =>
          sec.questionGroups?.flatMap((grp) => grp.questions ?? []) ?? [],
      ) ?? []
    );
  }, [test]);

  const handleAnswerChange = (qId: string, value: string) => {
    setAnswers((prev) => {
      const updated = { ...prev, [qId]: value };
      onAnswerUpdate?.(updated);
      return updated;
    });
  };

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current
          .play()
          .catch((err) => console.error("Audio play error:", err));
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const audioDuration = audioRef.current.duration || 600;
      setDuration(audioDuration);
      setCurrentTime(audioRef.current.currentTime);
      setProgress((audioRef.current.currentTime / audioDuration) * 100);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const totalQ = allQuestions.length;
  const answeredQ = Object.values(answers).filter((v) => v?.trim()).length;
  const unanswered = totalQ - answeredQ;

  return (
    <>
    <SplitTestLayout
      leftPanel={
        <AudioPlayerPanel
          audioRef={audioRef}
          isPlaying={isPlaying}
          progress={progress}
          currentTime={currentTime}
          duration={duration}
          test={test}
          onTogglePlay={togglePlay}
          onTimeUpdate={handleTimeUpdate}
          formatTime={formatTime}
        />
      }
      rightPanel={
        <>
          <QuestionMinimap
            questions={allQuestions}
            answeredQuestions={answers}
            onQuestionClick={(questionId) => {
              const elem = document.getElementById(`q-container-${questionId}`);
              elem?.scrollIntoView({ behavior: "smooth", block: "center" });
            }}
          />
          <QuestionsPanel
            title="Answer All Questions"
            questions={allQuestions}
            answeredQuestions={answers}
            actionButtons={
              <Button
                className="w-full h-12 text-base font-bold shadow-lg"
                onClick={() => setConfirmOpen(true)}
              >
                Submit Listening Answers
              </Button>
            }
          >
            <div className="space-y-10">
              {test?.sections?.map((section, si) => (
                <div key={section.id || si} className="space-y-5">
                  {section.questionGroups?.map((grp, gi) => (
                    <QuestionGroupBlock
                      key={grp.id || gi}
                      group={grp}
                      answers={answers}
                      onAnswerChange={handleAnswerChange}
                    />
                  ))}
                </div>
              ))}
            </div>
          </QuestionsPanel>
        </>
      }
    />

    <AlertDialog open={confirmOpen} onOpenChange={(o) => { if (!o) setConfirmOpen(false); }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Submit test?
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3 text-sm text-foreground">
              <div className="flex justify-between rounded-lg bg-muted px-4 py-3">
                <span className="text-muted-foreground">Answered</span>
                <span className="font-bold text-emerald-600">{answeredQ} / {totalQ}</span>
              </div>
              {unanswered > 0 && (
                <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-900/20 px-4 py-3 text-amber-700 dark:text-amber-300">
                  <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <span>
                    <strong>{unanswered}</strong> question{unanswered !== 1 ? "s" : ""} unanswered.
                    Blank answers will be marked incorrect.
                  </span>
                </div>
              )}
              <p className="text-muted-foreground">Once submitted, you cannot change your answers.</p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setConfirmOpen(false)}>Keep Testing</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => { setConfirmOpen(false); onFinish(answers); }}
            className="bg-rose-500 hover:bg-rose-600 text-white"
          >
            Submit Now
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}

// ─── Audio Player Panel ───────────────────────────────────────────────────────

function AudioPlayerPanel({
  audioRef,
  isPlaying,
  progress,
  currentTime,
  duration,
  test,
  onTogglePlay,
  onTimeUpdate,
  formatTime,
}: {
  audioRef: React.RefObject<HTMLAudioElement | null>;
  isPlaying: boolean;
  progress: number;
  currentTime: number;
  duration: number;
  test?: Test | null;
  onTogglePlay: () => void;
  onTimeUpdate: () => void;
  formatTime: (seconds: number) => string;
}) {
  const audioUrl = test?.sections?.[0]?.audioUrl || "/mock-loop.mp3";

  return (
    <div className="h-full overflow-y-auto custom-scrollbar bg-slate-50/50 dark:bg-slate-900/30">
      <div className="max-w-2xl mx-auto p-8 space-y-8 sticky top-0">
        <Card className="p-8 border-none shadow-xl bg-white dark:bg-slate-800 rounded-2xl">
          <div className="flex flex-col items-center gap-6">
            {/* Visualizer */}
            <div className="h-32 w-32 rounded-full bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 flex items-center justify-center relative shadow-inner">
              <div className="flex items-center gap-1 h-12">
                {[20, 35, 45, 30, 25].map((h, i) => (
                  <div
                    key={i}
                    className={`w-2 bg-blue-500 rounded-full ${isPlaying ? "animate-bounce" : ""}`}
                    style={{
                      height: isPlaying ? `${h}px` : "20px",
                      animationDelay: i * 0.1 + "s",
                    }}
                  />
                ))}
              </div>
            </div>

            <div className="text-center">
              <h2 className="text-2xl font-bold text-foreground">
                {test?.title || "Listening Test"}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {"Audio Track"}
              </p>
            </div>

            {/* Progress Bar & Controls */}
            <div className="w-full space-y-4">
              <div className="flex items-center justify-between text-xs font-mono text-muted-foreground px-1">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
              <Slider
                value={[progress]}
                max={100}
                className="w-full"
                disabled
              />

              <div className="flex justify-center pt-2">
                <Button
                  onClick={onTogglePlay}
                  size="icon"
                  className="h-16 w-16 rounded-full shadow-lg hover:scale-105 transition-transform"
                >
                  <span className="material-symbols-outlined text-[32px]">
                    {isPlaying ? "pause" : "play_arrow"}
                  </span>
                </Button>
              </div>
            </div>

            {/* Warning */}
            <div className="bg-yellow-50 dark:bg-yellow-900/10 p-3 rounded-lg flex items-center gap-2 text-xs text-yellow-800 dark:text-yellow-200 border border-yellow-100 dark:border-yellow-800/30 w-full">
              <span className="material-symbols-outlined text-sm">warning</span>
              <span className="font-medium">
                Note: You will hear the recording ONCE only.
              </span>
            </div>
          </div>
        </Card>

        {/* Hidden Audio Element */}
        <audio ref={audioRef} onTimeUpdate={onTimeUpdate} src={audioUrl} />
      </div>
    </div>
  );
}

// ─── Question Group Block ─────────────────────────────────────────────────────

function QuestionGroupBlock({
  group,
  answers,
  onAnswerChange,
}: {
  group: QuestionGroup;
  answers: Record<string, string>;
  onAnswerChange: (id: string, val: string) => void;
}) {
  const questions = group.questions ?? [];
  if (questions.length === 0) return null;

  const start = questions[0]?.questionOrder ?? 1;
  const end = questions[questions.length - 1]?.questionOrder ?? 1;
  const rangeLabel =
    start === end ? `Question ${start}` : `Questions ${start}-${end}`;

  return (
    <div className="space-y-5">
      {/* Instruction Block */}
      {group.instructions && (
        <div className="bg-blue-50/70 dark:bg-blue-900/10 border border-blue-200/60 dark:border-blue-800/30 rounded-xl p-5 shadow-sm">
          <p className="text-[11px] font-extrabold text-blue-700 dark:text-blue-400 uppercase tracking-widest mb-2.5 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            {rangeLabel}
          </p>
          <div
            className="prose prose-sm dark:prose-invert max-w-none [&>p]:m-0 [&>p]:leading-relaxed text-foreground/90"
            dangerouslySetInnerHTML={{ __html: group.instructions }}
          />
        </div>
      )}

      {/* Questions */}
      <div className="space-y-4">
        {questions.map((q: Question) => (
          <QuestionItem
            key={q.id}
            question={q}
            answer={answers[q.id] || ""}
            onAnswerChange={onAnswerChange}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Single Question Item ─────────────────────────────────────────────────────

function QuestionItem({
  question,
  answer,
  onAnswerChange,
}: {
  question: Question;
  answer: string;
  onAnswerChange: (id: string, val: string) => void;
}) {
  const { id, questionOrder, questionText, questionType, config } = question;

  const options: string[] = config?.options ?? config?.choices ?? [];
  const isMcq = questionType === "multiple_choice" || options.length > 0;
  const isTrueFalse =
    questionType === "true_false" ||
    questionType === "true_false_not_given" ||
    questionType === "yes_no_not_given";
  const isSelect = isTrueFalse || questionType === "matching";
  const selectOptions = isTrueFalse
    ? questionType === "yes_no_not_given"
      ? ["YES", "NO", "NOT GIVEN"]
      : ["TRUE", "FALSE", "NOT GIVEN"]
    : options;

  return (
    <div
      id={`q-container-${id}`}
      className="group bg-background border border-border rounded-xl p-5 shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-300"
    >
      {/* Question Header */}
      <div className="flex items-start gap-4 mb-4">
        <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-muted border border-border text-sm font-bold text-foreground select-none shadow-sm">
          {questionOrder}
        </div>

        <div className="flex-1 mt-1 text-foreground">
          {questionText ? (
            <div
              className="prose prose-sm dark:prose-invert max-w-none font-medium leading-[1.7] [&>p]:m-0"
              dangerouslySetInnerHTML={{ __html: questionText }}
            />
          ) : null}
        </div>
      </div>

      {/* Input Controls */}
      {isMcq ? (
        <div className="space-y-2.5 mt-4 ml-12">
          {options.map((opt, i) => {
            const optVal =
              typeof opt === "object"
                ? String((opt as { value?: unknown }).value ?? opt)
                : opt;
            const isSelected = answer === optVal;
            return (
              <label
                key={i}
                className={`flex items-start gap-3 p-3.5 rounded-lg cursor-pointer border transition-all ${isSelected
                  ? "bg-blue-50/80 border-blue-300 text-blue-900 font-bold dark:bg-blue-900/30 dark:border-blue-700 dark:text-blue-100 shadow-sm"
                  : "bg-background border-border hover:bg-muted hover:border-border text-foreground"
                  }`}
              >
                <input
                  type="radio"
                  name={`q-${id}`}
                  value={optVal}
                  checked={isSelected}
                  onChange={(e) => onAnswerChange(id, e.target.value)}
                  className="mt-0.5 w-4 h-4 accent-primary flex-shrink-0"
                />
                <span
                  className={`text-sm ${isSelected ? "font-semibold" : "font-medium"}`}
                >
                  {optVal}
                </span>
              </label>
            );
          })}
        </div>
      ) : isSelect ? (
        <div className="mt-4 ml-12">
          <select
            value={answer}
            onChange={(e) => onAnswerChange(id, e.target.value)}
            className="w-full max-w-sm h-12 rounded-lg border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary shadow-sm cursor-pointer transition-shadow"
          >
            <option value="" disabled>
              Select an answer…
            </option>
            {selectOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      ) : (
        <div className="mt-4 ml-12">
          <input
            type="text"
            value={answer}
            placeholder="Type your answer…"
            onChange={(e) => onAnswerChange(id, e.target.value)}
            className="w-full h-12 rounded-lg border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary shadow-sm transition-shadow placeholder:font-medium placeholder:text-muted-foreground"
          />
        </div>
      )}
    </div>
  );
}
