import { LearnerSidebar } from "./_components/learner-sidebar";

export default function LearnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <LearnerSidebar />
      <main className="flex-1 flex flex-col h-full overflow-y-auto">
        {/* Mobile Header có thể đặt ở đây */}
        {children}
      </main>
    </div>
  );
}
