import { LoginForm } from "./_components/login-form";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen w-full">
      {/* Left Side: Hero / Promo Section */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-slate-900 border-r border-border/50">
        {/* Background Overlay */}
        <div className="absolute inset-0 bg-zinc-900" />
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/30 via-purple-500/10 to-pink-500/10" />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between h-full p-12 text-white">
          {/* Logo / Brand */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 backdrop-blur-md border border-white/20">
              <span className="material-symbols-outlined text-white">school</span>
            </div>
            <span className="text-xl font-bold tracking-tight">IELTS Master</span>
          </div>

          {/* Hero Text */}
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 p-8 rounded-2xl shadow-2xl">
            <h1 className="text-4xl font-extrabold tracking-tight mb-4">
              Master the IELTS <br />
              <span className="text-indigo-300">with confidence.</span>
            </h1>
            <p className="text-lg text-slate-300 leading-relaxed mb-6">
              Join over 10,000 students achieving their dream scores with our comprehensive preparation tools and expert guidance.
            </p>
            <div className="flex items-center gap-4 text-sm text-slate-400">
              <div className="flex -space-x-3">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="w-8 h-8 rounded-full bg-slate-700 border-2 border-slate-900" />
                ))}
              </div>
              <span>Join the community today</span>
            </div>
          </div>

          {/* Footer */}
          <div className="text-sm text-slate-500 flex justify-between items-center">
            <span>© 2024 IELTS Master Platform</span>
            <div className="flex gap-4">
              <span className="hover:text-white cursor-pointer transition-colors">Privacy</span>
              <span className="hover:text-white cursor-pointer transition-colors">Terms</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side: Login Form */}
      <div className="flex w-full lg:w-1/2 flex-col justify-center items-center bg-background p-8 lg:p-12 relative overflow-hidden">
        {/* Decorative background elements for right side */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />

        <LoginForm />
      </div>
    </div>
  );
}
