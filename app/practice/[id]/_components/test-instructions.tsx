import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    CheckCircle2, AlertTriangle, Timer, BarChart3,
    ListChecks, RefreshCw, BookOpen, Layers, HelpCircle, Play
} from "lucide-react";

interface TestInstructionsProps {
    title: string;
    defaultDuration: number;
    questionCount: number;
    sectionCount: number;
    /** Mock tests always run on the official clock; practice tests may be shortened. */
    isMock?: boolean;
    skill?: string;
    isStarting?: boolean;
    onStart: (duration: number | "full") => void;
}

const SKILL_RULES: Record<string, { title: string; desc: string }[]> = {
    listening: [
        { title: "Audio plays once", desc: "Exactly like the real exam: each recording plays a single time and cannot be paused or replayed in mock mode." },
        { title: "Spelling counts", desc: "Answers with spelling mistakes are marked wrong. Check them before the next recording starts." },
        { title: "Write as you listen", desc: "Type your answers while the audio plays — there is no separate transfer time on the computer-delivered test." },
        { title: "40 questions, 4 parts", desc: "Each correct answer is one mark; the raw score is converted to a band using the official table." },
    ],
    reading: [
        { title: "3 passages, 40 questions", desc: "About 20 minutes per passage. No extra time is given to transfer answers." },
        { title: "Words from the passage", desc: "Respect the word limit in each instruction (e.g. NO MORE THAN TWO WORDS)." },
        { title: "No penalty for guessing", desc: "Never leave a blank — an unanswered question is simply a lost mark." },
        { title: "Review freely", desc: "You can move between passages and change answers until time runs out." },
    ],
    writing: [
        { title: "Task 1 ≥ 150 words, Task 2 ≥ 250 words", desc: "Under-length responses are penalised on Task Achievement / Task Response." },
        { title: "Task 2 counts double", desc: "Spend about 20 minutes on Task 1 and 40 minutes on Task 2." },
        { title: "Answer the question asked", desc: "The AI examiner reads the prompt too — off-topic or memorised text is capped at Band 4–5." },
        { title: "Four criteria", desc: "Task Achievement/Response, Coherence & Cohesion, Lexical Resource, Grammatical Range & Accuracy." },
    ],
    speaking: [
        { title: "Three parts, 11–14 minutes", desc: "Part 1 interview, Part 2 long turn (1 min prep + 2 min talk), Part 3 discussion." },
        { title: "Your voice is transcribed", desc: "Recordings are transcribed with Whisper and graded on Fluency, Lexical Resource, Grammar and Pronunciation." },
        { title: "Speak until the examiner stops you", desc: "Longer, developed answers score higher than one-word replies." },
        { title: "Quiet room, working microphone", desc: "Allow microphone access when prompted." },
    ],
};

export function TestInstructions({
    title,
    defaultDuration,
    questionCount,
    sectionCount,
    isMock = false,
    skill = "reading",
    isStarting,
    onStart,
}: TestInstructionsProps) {
    const [selectedDuration, setSelectedDuration] = useState<string>("full");
    const rules = SKILL_RULES[skill] ?? SKILL_RULES.reading;

    return (
        <div className="min-h-full bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
            <div className="max-w-3xl mx-auto px-6 py-10 space-y-8">

                {/* Header Card */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-blue-600 to-indigo-700 text-white p-8 shadow-xl shadow-primary/20">
                    <div className="absolute inset-0 opacity-10">
                        <div className="absolute -top-10 -right-10 h-60 w-60 rounded-full bg-white" />
                        <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-white" />
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-3">
                            <Badge className="bg-white/20 text-white border-none text-xs">
                                {isMock ? "Full Mock Test · Official timing" : "Practice Mode"}
                            </Badge>
                        </div>
                        <h1 className="text-2xl md:text-3xl font-black leading-snug mb-3">{title}</h1>
                        <div className="flex flex-wrap items-center gap-4 text-white/80 text-sm">
                            {sectionCount > 0 && (
                                <span className="flex items-center gap-1.5">
                                    <Layers className="h-4 w-4" /> {sectionCount} sections
                                </span>
                            )}
                            {questionCount > 0 && (
                                <span className="flex items-center gap-1.5">
                                    <HelpCircle className="h-4 w-4" /> {questionCount} questions
                                </span>
                            )}
                            <span className="flex items-center gap-1.5">
                                <Timer className="h-4 w-4" /> {defaultDuration} min standard
                            </span>
                        </div>
                    </div>
                </div>

                {/* Warning Banner */}
                <div className="flex items-start gap-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 rounded-xl p-4 text-amber-800 dark:text-amber-200">
                    <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5 text-amber-500" />
                    <div>
                        <p className="font-semibold text-sm">Please read before starting</p>
                        <p className="text-sm opacity-85 mt-0.5">
                            The timer starts on the server when you click Start and keeps running even if you close this tab.
                            Your answers are saved automatically every few seconds.
                        </p>
                    </div>
                </div>

                {/* Skill-specific exam rules */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {rules.map((r, i) => (
                        <InstructionCard
                            key={r.title}
                            icon={[ListChecks, RefreshCw, BookOpen, Timer][i % 4]}
                            color={[
                                "text-blue-600 bg-blue-50 dark:bg-blue-900/30",
                                "text-violet-600 bg-violet-50 dark:bg-violet-900/30",
                                "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30",
                                "text-orange-600 bg-orange-50 dark:bg-orange-900/30",
                            ][i % 4]}
                            title={r.title}
                            desc={r.desc}
                        />
                    ))}
                </div>

                {/* Test Overview & Timer Selection */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Overview */}
                    <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
                        <h3 className="font-bold flex items-center gap-2">
                            <BarChart3 className="h-5 w-5 text-primary" />
                            Test Overview
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="text-center p-4 rounded-xl bg-primary/5 border border-primary/10">
                                <p className="text-3xl font-black text-primary">{sectionCount || "–"}</p>
                                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mt-1">Sections</p>
                            </div>
                            <div className="text-center p-4 rounded-xl bg-primary/5 border border-primary/10">
                                <p className="text-3xl font-black text-primary">{questionCount || "–"}</p>
                                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mt-1">Questions</p>
                            </div>
                        </div>
                    </div>

                    {/* Timer Selection */}
                    <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6 space-y-4">
                        <h3 className="font-bold flex items-center gap-2">
                            <Timer className="h-5 w-5 text-primary" />
                            {isMock ? "Exam Timer" : "Practice Duration"}
                        </h3>
                        {isMock ? (
                            <div className="rounded-xl bg-background border border-border p-4 text-sm">
                                <p className="font-semibold">{defaultDuration} minutes — official timing</p>
                                <p className="text-muted-foreground text-xs mt-1">
                                    This is a full mock test. The clock runs on the server and your answers are submitted automatically when it reaches zero.
                                </p>
                            </div>
                        ) : (
                        <>
                        <p className="text-sm text-muted-foreground">Choose how long you want to practice:</p>
                        <Select value={selectedDuration} onValueChange={setSelectedDuration}>
                            <SelectTrigger className="w-full bg-background h-11">
                                <SelectValue placeholder="Select duration" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="full">
                                    <span className="flex items-center gap-2">
                                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                        Full Test ({defaultDuration} min)
                                    </span>
                                </SelectItem>
                                <SelectItem value="40">40 Minutes</SelectItem>
                                <SelectItem value="20">20 Minutes</SelectItem>
                                <SelectItem value="10">10 Minutes</SelectItem>
                                <SelectItem value="5">5 Minutes (Quick)</SelectItem>
                            </SelectContent>
                        </Select>
                        </>
                        )}
                    </div>
                </div>

                {/* Start Button */}
                <div className="flex flex-col items-center gap-3 pt-4">
                    <Button
                        onClick={() => onStart(selectedDuration === "full" ? "full" : parseInt(selectedDuration))}
                        disabled={isStarting}
                        size="lg"
                        className="w-full max-w-sm h-14 text-lg font-black rounded-2xl shadow-xl shadow-primary/25 hover:scale-[1.02] active:scale-[0.98] transition-all gap-2"
                    >
                        {isStarting ? (
                            <>
                                <RefreshCw className="h-5 w-5 animate-spin" />
                                Starting...
                            </>
                        ) : (
                            <>
                                <Play className="h-5 w-5" />
                                Start Test Now
                            </>
                        )}
                    </Button>
                    <p className="text-xs text-muted-foreground">By clicking start, you agree to the test conditions.</p>
                </div>

                <p className="text-center text-xs text-muted-foreground pb-4">
                    IELTS-MN — IELTS Academic practice platform
                </p>
            </div>
        </div>
    );
}

function InstructionCard({
    icon: Icon,
    color,
    title,
    desc,
}: {
    icon: React.ElementType;
    color: string;
    title: string;
    desc: string;
}) {
    return (
        <div className="rounded-2xl border border-border bg-card p-5 flex flex-col gap-3 hover:border-primary/40 hover:shadow-sm transition-all duration-200">
            <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${color}`}>
                <Icon className="h-5 w-5" />
            </div>
            <div>
                <h3 className="font-bold text-sm">{title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed mt-1">{desc}</p>
            </div>
        </div>
    );
}
