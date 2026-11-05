import { TeacherSidebar } from "./_components/teacher-sidebar";

export default function TeacherGroupLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background lg:flex-row">
      <TeacherSidebar />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
