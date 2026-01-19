import { LoginForm } from "./_components/login-form";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen w-full">
      {/* Bên trái: Ảnh nền (Giữ nguyên logic cũ hoặc tách ra component HeroImage) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-slate-900">
        <div className="absolute inset-0 bg-primary/20" />
        <div className="z-10 m-auto text-white">
          <h1 className="text-4xl font-bold">Master IELTS</h1>
        </div>
      </div>

      {/* Bên phải: Form */}
      <div className="flex w-full lg:w-1/2 flex-col justify-center items-center bg-background p-6">
        <LoginForm />
      </div>
    </div>
  );
}
