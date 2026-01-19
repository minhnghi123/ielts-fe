import { Card } from "@/components/ui/card";

export function WelcomeHeader() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap justify-between items-end gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">
            Good Morning, Alex
          </h1>
          <p className="text-muted-foreground text-base">
            Ready to improve your band score today? Choose a module to begin
            practice.
          </p>
        </div>

        {/* Target Score Badge */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-background px-4 py-2 rounded-full border shadow-sm">
          <span className="material-symbols-outlined text-yellow-500 text-[20px]">
            emoji_events
          </span>
          <span>
            Target Score: <span className="font-bold text-foreground">8.0</span>
          </span>
        </div>
      </div>
    </div>
  );
}
