import { Card, CardContent } from "@/components/ui/card";

export function StatOverview() {
  // Mock data (Sau này có thể thay bằng props lấy từ API)
  const stats = [
    {
      title: "Overall Readiness",
      value: "High",
      trend: "+12%",
      icon: "monitoring",
      // Style cho icon và background icon
      iconColor: "text-blue-600 dark:text-blue-400",
      iconBg: "bg-blue-50 dark:bg-blue-900/20",
    },
    {
      title: "Tests Completed",
      value: "24",
      trend: "+3",
      icon: "assignment_turned_in",
      iconColor: "text-purple-600 dark:text-purple-400",
      iconBg: "bg-purple-50 dark:bg-purple-900/20",
    },
    {
      title: "Average Band Score",
      value: "7.5",
      trend: "+0.5",
      icon: "grade",
      iconColor: "text-orange-600 dark:text-orange-400",
      iconBg: "bg-orange-50 dark:bg-orange-900/20",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {stats.map((stat, index) => (
        <Card
          key={index}
          className="shadow-sm hover:shadow-md transition-shadow"
        >
          <CardContent className="p-5">
            <div className="flex justify-between items-start">
              <div
                className={`p-2 rounded-lg ${stat.iconBg} ${stat.iconColor}`}
              >
                <span className="material-symbols-outlined">{stat.icon}</span>
              </div>
              <span className="text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400 text-xs font-bold px-2 py-1 rounded-full">
                {stat.trend}
              </span>
            </div>
            <p className="text-muted-foreground text-sm font-medium mt-3">
              {stat.title}
            </p>
            <p className="text-2xl font-bold mt-1">{stat.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
