import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface TestCardProps {
  title: string;
  category: "Listening" | "Reading" | "Writing" | "Speaking";
  difficulty: "Easy" | "Medium" | "Hard";
  duration: string;
  questionCount: number;
  tags: string[];
}

export function TestCard({
  title,
  category,
  difficulty,
  duration,
  questionCount,
  tags,
}: TestCardProps) {
  // Map màu sắc cho từng category
  const categoryColor = {
    Listening:
      "text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300",
    Reading:
      "text-purple-600 bg-purple-100 dark:bg-purple-900/30 dark:text-purple-300",
    Writing:
      "text-orange-600 bg-orange-100 dark:bg-orange-900/30 dark:text-orange-300",
    Speaking:
      "text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-300",
  };

  const difficultyColor = {
    Easy: "bg-green-500",
    Medium: "bg-yellow-500",
    Hard: "bg-red-500",
  };

  return (
    <Card className="flex flex-col h-full hover:border-primary transition-all cursor-pointer group shadow-sm">
      <CardHeader className="p-5 pb-2">
        <div className="flex justify-between items-start mb-2">
          <span
            className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${categoryColor[category]}`}
          >
            {category}
          </span>
          <Badge
            variant="outline"
            className={`${difficultyColor[difficulty]} text-white border-none`}
          >
            {difficulty}
          </Badge>
        </div>
        <h3 className="font-bold text-lg leading-tight group-hover:text-primary transition-colors">
          {title}
        </h3>
      </CardHeader>

      <CardContent className="p-5 py-2 flex-1">
        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
          <div className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[18px]">
              schedule
            </span>
            <span>{duration}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[18px]">
              help_outline
            </span>
            <span>{questionCount} Qs</span>
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2">
          {tags.map((tag, i) => (
            <span
              key={i}
              className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-1 rounded"
            >
              #{tag}
            </span>
          ))}
        </div>
      </CardContent>

      <CardFooter className="p-5 pt-2">
        <Button className="w-full bg-slate-900 dark:bg-slate-700 hover:bg-primary dark:hover:bg-primary transition-colors">
          Start Practice
        </Button>
      </CardFooter>
    </Card>
  );
}
