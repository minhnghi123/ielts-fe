"use client";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";

export function HomeNavbar() {
  const router = useRouter();

  return (
    <header className="sticky top-0 z-50 w-full bg-white dark:bg-[#151c2a] border-b border-border">
      <div className="max-w-[1200px] mx-auto flex items-center justify-between px-6 py-3">
        <div className="flex items-center gap-10">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 cursor-pointer">
            <div className="text-primary h-8 w-8 bg-primary/10 flex items-center justify-center rounded-lg">
              <span className="material-symbols-outlined">school</span>
            </div>
            <h2 className="text-xl font-bold tracking-tight">IELTS Master</h2>
          </Link>

          {/* Menu */}
          <nav className="hidden md:flex items-center gap-8">
            <Link
              href="/"
              className="text-primary text-sm font-semibold border-b-2 border-primary pb-1"
            >
              Home
            </Link>
            <Link
              href="/dashboard"
              className="text-muted-foreground text-sm font-medium hover:text-primary transition-colors"
            >
              My Progress
            </Link>
            <Link
              href="/practice"
              className="text-muted-foreground text-sm font-medium hover:text-primary transition-colors"
            >
              Practice
            </Link>
            <Link
              href="/analysis"
              className="text-muted-foreground text-sm font-medium hover:text-primary transition-colors"
            >
              Analysis
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-6">
          {/* Search */}
          <div className="hidden sm:flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg px-3 py-1.5 w-64">
            <span className="material-symbols-outlined text-muted-foreground text-[20px]">
              search
            </span>
            <input
              className="bg-transparent border-none focus:outline-none text-sm w-full placeholder:text-muted-foreground ml-2 text-foreground"
              placeholder="Search tests, topics..."
              type="text"
            />
          </div>
          {/* Avatar */}
          <div className="flex items-center gap-3">
            <button className="text-muted-foreground hover:text-primary">
              <span className="material-symbols-outlined">notifications</span>
            </button>
            <Avatar
              className="h-9 w-9 border-2 border-primary/20 cursor-pointer"
              onClick={() => router.push("/dashboard")}
            >
              <AvatarImage src="https://github.com/shadcn.png" />
              <AvatarFallback>AC</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </div>
    </header>
  );
}
