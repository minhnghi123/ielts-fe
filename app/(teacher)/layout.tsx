import { TeacherSidebar } from "./_components/teacher-sidebar";

export default function TeacherGroupLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <TeacherSidebar />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
