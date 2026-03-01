import { RegisterForm } from "./_components/register-form";
import Link from "next/link";

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen w-full">
      {/* Left side: Hero Image with Premium Aesthetics */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-slate-900 border-r border-border/50">
        <div className="absolute inset-0 bg-zinc-900" />
        <div className="absolute inset-0 bg-gradient-to-tr from-rose-500/20 via-orange-500/10 to-transparent" />

        <div className="relative z-10 flex flex-col justify-between h-full p-12 text-white">
          <div className="flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-700">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 backdrop-blur-md border border-white/20">
              <span className="material-symbols-outlined text-white">school</span>
            </div>
            <span className="text-xl font-bold tracking-tight">IELTS Master</span>
          </div>

          <div className="bg-white/5 backdrop-blur-sm border border-white/10 p-8 rounded-2xl shadow-2xl animate-in fade-in slide-in-from-left-8 duration-700 delay-150 fill-mode-both">
            <h1 className="text-4xl font-extrabold tracking-tight mb-4 text-transparent bg-clip-text bg-gradient-to-r from-orange-200 to-rose-200">
              Start Your Journey.
            </h1>
            <p className="text-lg text-slate-300 leading-relaxed mb-6">
              Create an account to track your progress, practice with realistic mock tests, and achieve your target band score.
            </p>
          </div>

          <div className="text-sm text-slate-500 flex justify-between items-center animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300 fill-mode-both">
            <span>© 2024 IELTS Master Platform</span>
            <div className="flex gap-4">
              <Link href="/privacy" className="hover:text-white transition-colors duration-200">Privacy</Link>
              <Link href="/terms" className="hover:text-white transition-colors duration-200">Terms</Link>
            </div>
          </div>
        </div>
      </div>

      {/* Right side: Form */}
      <div className="flex w-full lg:w-1/2 flex-col justify-center items-center bg-background p-8 lg:p-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-rose-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-orange-500/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />

        <RegisterForm />
      </div>
    </div>
  );
}
