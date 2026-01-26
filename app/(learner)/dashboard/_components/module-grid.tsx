"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils"; // Hàm tiện ích có sẵn khi cài shadcn

export function ModuleGrid() {
  const router = useRouter();

  const modules = [
    {
      id: "listening",
      title: "Listening Module",
      info: "30 mins • 4 Sections • 40 Questions",
      available: 12,
      progress: 65,
      icon: "headphones",
      theme: "blue", // Định danh theme màu
    },
    {
      id: "reading",
      title: "Reading Module",
      info: "60 mins • 3 Passages • 40 Questions",
      available: 8,
      progress: 42,
      icon: "menu_book",
      theme: "purple",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {modules.map((module) => {
        // Cấu hình màu sắc dựa trên theme
        const isBlue = module.theme === "blue";

        const colors = {
          bgIcon: isBlue
            ? "bg-blue-100 dark:bg-blue-900/30"
            : "bg-purple-100 dark:bg-purple-900/30",
          textIcon: isBlue
            ? "text-primary"
            : "text-purple-600 dark:text-purple-400",
          bgDecoration: isBlue
            ? "bg-blue-50 dark:bg-blue-900/10"
            : "bg-purple-50 dark:bg-purple-900/10",
          hoverBorder: isBlue
            ? "hover:border-primary"
            : "hover:border-purple-500",
          btnColor: isBlue
            ? "bg-primary hover:bg-blue-700"
            : "bg-purple-600 hover:bg-purple-700 dark:bg-purple-600",
          progressIndicator: isBlue ? "bg-primary" : "bg-purple-600",
        };

        return (
          <Card
            key={module.id}
            className={cn(
              "group relative overflow-hidden transition-all hover:shadow-lg flex flex-col justify-between min-h-[300px]",
              colors.hoverBorder,
            )}
          >
            {/* Background Decoration Circle */}
            <div
              className={cn(
                "absolute right-0 top-0 size-48 translate-x-12 -translate-y-12 rounded-full transition-transform group-hover:scale-110",
                colors.bgDecoration,
              )}
            />

            <CardContent className="p-8 flex flex-col justify-between h-full z-10 relative">
              <div className="flex flex-col gap-6">
                {/* Icon Box */}
                <div
                  className={cn(
                    "w-fit p-4 rounded-xl",
                    colors.bgIcon,
                    colors.textIcon,
                  )}
                >
                  <span className="material-symbols-outlined text-[32px]">
                    {module.icon}
                  </span>
                </div>

                {/* Title & Info */}
                <div>
                  <h3 className="text-2xl font-bold mb-2">{module.title}</h3>
                  <p className="text-muted-foreground mb-4">{module.info}</p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="material-symbols-outlined text-green-500 text-[18px]">
                      check_circle
                    </span>
                    <span>{module.available} tests available</span>
                  </div>
                </div>
              </div>

              {/* Progress Section */}
              <div className="mt-6 pt-6 border-t">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-sm font-medium">Mastery Level</span>
                  <span className={cn("text-sm font-bold", colors.textIcon)}>
                    {module.progress}%
                  </span>
                </div>

                {/* Progress Bar */}
                {/* Lưu ý: Shadcn Progress mặc định dùng overflow-hidden, ta set màu qua className */}
                <Progress
                  value={module.progress}
                  className="h-2"
                  indicatorColor={colors.progressIndicator}
                />

                <Button
                  onClick={() => router.push(`/practice?module=${module.id}`)}
                  className={cn(
                    "mt-6 w-full font-bold text-white shadow-md transition-colors",
                    colors.btnColor,
                  )}
                >
                  <span>Start {module.title.split(" ")[0]} Test</span>
                  <span className="material-symbols-outlined ml-2 text-[20px]">
                    arrow_forward
                  </span>
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
