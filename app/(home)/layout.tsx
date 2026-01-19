import { HomeNavbar } from "./_components/home-navbar";

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground font-display">
      {/* Navbar luôn dính ở trên cùng */}
      <HomeNavbar />

      {/* Nội dung chính */}
      <main className="flex-1 w-full max-w-[1200px] mx-auto px-6 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-[#151c2a] border-t border-border py-10 mt-auto">
        <div className="max-w-[1200px] mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="text-primary h-6 w-6 flex items-center justify-center bg-primary/10 rounded">
              <span className="material-symbols-outlined text-[18px]">
                school
              </span>
            </div>
            <span className="font-bold">IELTS Master</span>
          </div>
          <div className="flex gap-8 text-sm text-muted-foreground">
            <a href="#" className="hover:text-primary">
              Support
            </a>
            <a href="#" className="hover:text-primary">
              Terms
            </a>
            <a href="#" className="hover:text-primary">
              Privacy
            </a>
          </div>
          <p className="text-sm text-muted-foreground">© 2024 IELTS Master</p>
        </div>
      </footer>
    </div>
  );
}
