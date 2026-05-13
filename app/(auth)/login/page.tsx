import { LoginForm } from "./_components/login-form";
import Link from "next/link";

export default function LoginPage() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-zinc-50 px-4">
      <LoginForm />
      <p className="mt-8 text-xs text-zinc-400">
        © 2024 IELTS-MN Platform ·{" "}
        <Link href="/privacy" className="hover:text-zinc-700 transition-colors duration-150">Privacy</Link>
        {" · "}
        <Link href="/terms" className="hover:text-zinc-700 transition-colors duration-150">Terms</Link>
      </p>
    </div>
  );
}
