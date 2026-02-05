import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";

export function ListeningTestInterface({
    testId,
    onFinish,
}: {
    testId: string;
    onFinish: () => void;
}) {
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Mock audio duration - simulating 10 minutes
    const DURATION = 600;

    const handleAnswerChange = (qId: string, value: string) => {
        setAnswers((prev) => ({ ...prev, [qId]: value }));
    };

    const togglePlay = () => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause();
            } else {
                audioRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    const handleTimeUpdate = () => {
        if (audioRef.current) {
            setProgress((audioRef.current.currentTime / DURATION) * 100);
        }
    }

    return (
        <div className="h-full flex flex-col lg:flex-row overflow-hidden">
            {/* LEFT PANEL: AUDIO CONTROLS & INFO */}
            <div className="w-full lg:w-1/2 p-6 md:p-10 border-r border-border overflow-y-auto h-full bg-slate-50 dark:bg-slate-900/50">
                <div className="max-w-2xl mx-auto space-y-8 sticky top-0">
                    <Badge variant="outline" className="mb-2 bg-blue-50 text-blue-700 border-blue-200">
                        Listening Part 1
                    </Badge>

                    <Card className="p-8 border-none shadow-xl bg-white dark:bg-slate-800 rounded-2xl">
                        <div className="flex flex-col items-center gap-6">
                            <div className="h-32 w-32 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center relative">
                                {/* Visualizer bars placeholder */}
                                <div className="flex items-center gap-1 h-12">
                                    {[1, 2, 3, 4, 5].map(i => (
                                        <div key={i} className={`w-2 bg-blue-500 rounded-full animate-bounce`} style={{ height: Math.random() * 40 + 10 + 'px', animationDelay: i * 0.1 + 's' }} />
                                    ))}
                                </div>
                            </div>

                            <div className="text-center">
                                <h2 className="text-2xl font-bold">Library Card Application</h2>
                                <p className="text-muted-foreground">Section 1 Audio Track</p>
                            </div>

                            <div className="w-full space-y-4">
                                <div className="flex items-center justify-between text-xs font-mono text-muted-foreground">
                                    <span>00:00</span>
                                    <span>10:00</span>
                                </div>
                                <Slider value={[progress]} max={100} className="w-full" disabled />

                                <div className="flex justify-center">
                                    <Button
                                        onClick={togglePlay}
                                        size="icon"
                                        className="h-16 w-16 rounded-full shadow-lg hover:scale-105 transition-transform"
                                    >
                                        <span className="material-symbols-outlined text-[32px]">
                                            {isPlaying ? 'pause' : 'play_arrow'}
                                        </span>
                                    </Button>
                                </div>
                            </div>

                            <div className="bg-yellow-50 dark:bg-yellow-900/10 p-3 rounded-lg flex items-center gap-2 text-xs text-yellow-800 dark:text-yellow-200 border border-yellow-100 dark:border-yellow-800/30">
                                <span className="material-symbols-outlined text-sm">warning</span>
                                <span>Note: You will hear the recording ONCE only.</span>
                            </div>
                        </div>
                    </Card>

                    {/* Hidden Audio Element for Logic */}
                    <audio ref={audioRef} onTimeUpdate={handleTimeUpdate} src="/mock-loop.mp3" />
                </div>
            </div>

            {/* RIGHT PANEL: QUESTIONS */}
            <div className="w-full lg:w-1/2 p-6 md:p-10 overflow-y-auto h-full bg-background scroll-smooth">
                <div className="max-w-2xl mx-auto space-y-10">

                    {/* SECTION 1: Form Completion */}
                    <section className="space-y-6">
                        <div className="bg-primary/5 p-4 rounded-lg border border-primary/10">
                            <h3 className="font-bold text-primary mb-2">
                                Questions 1-5
                            </h3>
                            <p className="text-sm">
                                Complete the notes below. Write <strong>NO MORE THAN TWO WORDS AND/OR A NUMBER</strong> for each answer.
                            </p>
                        </div>

                        <Card className="p-8 border shadow-sm bg-white dark:bg-slate-800">
                            <h3 className="text-xl font-bold text-center mb-8 uppercase tracking-widest border-b pb-4">
                                Library Card Application Form
                            </h3>

                            <div className="space-y-6 font-medium">
                                <QuestionInput
                                    id="q1"
                                    label="First Name"
                                    value={answers["q1"]}
                                    onChange={handleAnswerChange}
                                    prefix="Example: "
                                    placeholder="Alex"
                                />
                                <QuestionInput
                                    id="q2"
                                    label="Surname"
                                    value={answers["q2"]}
                                    onChange={handleAnswerChange}
                                />
                                <QuestionInput
                                    id="q3"
                                    label="Address"
                                    value={answers["q3"]}
                                    onChange={handleAnswerChange}
                                    suffix="Flat 4, "
                                />
                                <QuestionInput
                                    id="q4"
                                    label="Postcode"
                                    value={answers["q4"]}
                                    onChange={handleAnswerChange}
                                />
                                <QuestionInput
                                    id="q5"
                                    label="Date of Birth"
                                    value={answers["q5"]}
                                    onChange={handleAnswerChange}
                                    type="date"
                                />
                            </div>
                        </Card>
                    </section>

                    <hr className="border-border" />

                    {/* SECTION 2: Multiple Choice */}
                    <section className="space-y-6">
                        <div className="bg-primary/5 p-4 rounded-lg border border-primary/10">
                            <h3 className="font-bold text-primary mb-2">
                                Questions 6-8
                            </h3>
                            <p className="text-sm">
                                Choose the correct letter, <strong>A, B or C</strong>.
                            </p>
                        </div>

                        <div className="space-y-8">
                            <div className="space-y-3">
                                <p className="font-bold">6. What is the main reason for the library's renovation?</p>
                                <div className="space-y-2 pl-4">
                                    {['A. To add more books', 'B. To create more study space', 'C. To improve safety'].map(opt => (
                                        <label key={opt} className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer border border-transparent hover:border-border transition-all">
                                            <input
                                                type="radio"
                                                name="q6"
                                                className="w-4 h-4 text-primary accent-primary"
                                                checked={answers["q6"] === opt.charAt(0)}
                                                onChange={(e) => handleAnswerChange("q6", opt.charAt(0))}
                                            />
                                            <span>{opt}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-3">
                                <p className="font-bold">7. Which service is no longer free?</p>
                                <div className="space-y-2 pl-4">
                                    {['A. Internet access', 'B. DVD rentals', 'C. Printing'].map(opt => (
                                        <label key={opt} className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer border border-transparent hover:border-border transition-all">
                                            <input
                                                type="radio"
                                                name="q7"
                                                className="w-4 h-4 text-primary accent-primary"
                                                checked={answers["q7"] === opt.charAt(0)}
                                                onChange={(e) => handleAnswerChange("q7", opt.charAt(0))}
                                            />
                                            <span>{opt}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Submit */}
                    <div className="pt-10 pb-20">
                        <Button
                            className="w-full h-14 text-lg font-bold shadow-lg"
                            onClick={onFinish}
                        >
                            Submit Listening Answers
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function QuestionInput({ id, label, value, onChange, prefix, suffix, placeholder, type = "text" }: any) {
    return (
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 pb-4 border-b border-dashed last:border-0 last:pb-0">
            <label htmlFor={id} className="min-w-[120px] text-muted-foreground">{label}:</label>
            <div className="flex-1 flex items-center gap-2">
                {prefix && <span>{prefix}</span>}
                <input
                    id={id}
                    type={type}
                    value={value || ""}
                    onChange={(e) => onChange(id, e.target.value)}
                    className="flex-1 h-10 border-b-2 border-slate-300 dark:border-slate-700 bg-transparent px-2 focus:outline-none focus:border-primary transition-colors font-bold text-lg"
                    placeholder={placeholder}
                />
                {suffix && <span>{suffix}</span>}
            </div>
        </div>
    )
}
