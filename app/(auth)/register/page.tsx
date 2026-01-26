import { RegisterForm } from "./_components/register-form";

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen w-full">
      {/* Left side: Hero Image */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-slate-900">
        <div className="absolute inset-0 bg-primary/20" />
        <div className="z-10 m-auto text-white text-center px-8">
          <h1 className="text-4xl font-bold mb-4">Join IELTS Master</h1>
          <p className="text-lg text-white/80">
            Start your journey to achieve your target band score
          </p>
        </div>
      </div>

      {/* Right side: Form */}
      <div className="flex w-full lg:w-1/2 flex-col justify-center items-center bg-background p-6">
        <RegisterForm />
      </div>
    </div>
  );
}
