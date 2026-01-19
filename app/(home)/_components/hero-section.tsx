import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function HeroSection() {
  return (
    <section className="mb-10">
      <Card className="overflow-hidden border-border shadow-sm">
        <div className="flex flex-col md:flex-row">
          <div
            className="w-full md:w-1/2 bg-cover bg-center min-h-[250px]"
            style={{
              backgroundImage:
                'url("https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=1771&auto=format&fit=crop")',
            }}
          ></div>
          <div className="w-full md:w-1/2 p-8 flex flex-col justify-center gap-6 bg-white dark:bg-[#151c2a]">
            <div>
              <h1 className="text-3xl font-black leading-tight mb-3">
                Welcome back, Alex Chen!
              </h1>
              <p className="text-muted-foreground text-lg leading-relaxed">
                You're doing great! You've completed 12 practice tests and
                you're 15% closer to your target band score of 8.0.
              </p>
            </div>
            <div className="flex flex-wrap gap-4">
              <Button className="bg-primary hover:bg-blue-700 font-bold px-8 py-6 text-base shadow-md shadow-blue-500/20">
                <span className="material-symbols-outlined mr-2">
                  play_arrow
                </span>
                Resume Practice
              </Button>
              <Button
                variant="secondary"
                className="bg-primary/10 text-primary hover:bg-primary/20 font-bold px-8 py-6 text-base"
              >
                View Daily Goals
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </section>
  );
}
