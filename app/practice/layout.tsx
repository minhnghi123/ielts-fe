"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { X, GraduationCap, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { PracticeProvider, usePractice } from "./[id]/practice-context";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

function PracticeHeader() {
    const { testTitle, attemptId, triggerExitAndSave } = usePractice();
    const router = useRouter();
    const [isExiting, setIsExiting] = useState(false);

    const testInProgress = !!attemptId;

    const handleExit = async () => {
        if (testInProgress) {
            setIsExiting(true);
            try {
                // Submit whatever answers the learner has, then navigate to result
                await triggerExitAndSave();
                // triggerExitAndSave calls handleFinishTest which does router.push(result)
            } catch {
                // Fallback: if submission fails, just leave
                router.push("/tests");
            } finally {
                setIsExiting(false);
            }
        } else {
            router.push("/tests");
        }
    };

    return (
        <header className="h-12 border-b border-border/60 bg-white dark:bg-slate-900 px-4 flex items-center justify-between sticky top-0 z-50 shadow-sm">
            {/* Left: Test title */}
            <div className="flex items-center gap-2 min-w-0">
                <GraduationCap className="h-4 w-4 text-primary flex-shrink-0" />
                <span className="font-semibold text-sm text-foreground truncate max-w-sm">
                    {testTitle || "IELTS Practice"}
                </span>
            </div>

            {/* Right: Exit */}
            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 flex-shrink-0 h-8 px-3 text-xs font-semibold"
                    >
                        <X className="h-3.5 w-3.5" />
                        Thoát
                    </Button>
                </AlertDialogTrigger>

                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {testInProgress ? "Exit and save test?" : "Exit test?"}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {testInProgress
                                ? "Your answers will be automatically submitted and you will be redirected to your results."
                                : "Are you sure you want to leave? You can return and start the test any time."}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Continue Test</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleExit}
                            disabled={isExiting}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90 gap-2"
                        >
                            {isExiting && <Loader2 className="h-4 w-4 animate-spin" />}
                            {testInProgress ? "Submit & Exit" : "Exit"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </header>
    );
}

export default function PracticeLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <PracticeProvider>
            <div className="min-h-screen bg-background text-foreground flex flex-col">
                <PracticeHeader />
                <main className="flex-1 overflow-hidden relative">
                    {children}
                </main>
            </div>
        </PracticeProvider>
    );
}
