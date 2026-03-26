import { AlertTriangle } from "lucide-react";
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

export function SubmitConfirmDialog({
  open,
  answeredCount,
  totalCount,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  answeredCount: number;
  totalCount: number;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const unanswered = totalCount - answeredCount;
  return (
    <AlertDialog open={open} onOpenChange={(o) => { if (!o) onCancel(); }}>
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
                <span className="font-bold text-emerald-600">{answeredCount} / {totalCount}</span>
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
          <AlertDialogCancel onClick={onCancel}>Keep Testing</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-rose-500 hover:bg-rose-600 text-white"
          >
            Submit Now
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
