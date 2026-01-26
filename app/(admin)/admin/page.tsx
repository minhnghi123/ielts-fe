import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function AdminDashboardPage() {
  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto w-full flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
          Admin Dashboard
        </h1>
        <p className="text-muted-foreground">
          Manage users, tests, and monitor system performance
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Users"
          value="2,847"
          trend="+12%"
          icon="group"
          color="blue"
        />
        <StatCard
          title="Active Tests"
          value="156"
          trend="+8"
          icon="assignment"
          color="green"
        />
        <StatCard
          title="Avg. Score"
          value="7.2"
          trend="+0.3"
          icon="grade"
          color="purple"
        />
        <StatCard
          title="Revenue"
          value="$48.5k"
          trend="+18%"
          icon="payments"
          color="orange"
        />
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent User Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <ActivityItem
              user="learner@example.com"
              action="Completed Mock Test #14"
              time="5 mins ago"
            />
            <ActivityItem
              user="student@example.com"
              action="Registered new account"
              time="12 mins ago"
            />
            <ActivityItem
              user="test@example.com"
              action="Started Listening Module"
              time="23 mins ago"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ title, value, trend, icon, color }: any) {
  const colors: any = {
    blue: "bg-blue-50 dark:bg-blue-900/20 text-blue-600",
    green: "bg-green-50 dark:bg-green-900/20 text-green-600",
    purple: "bg-purple-50 dark:bg-purple-900/20 text-purple-600",
    orange: "bg-orange-50 dark:bg-orange-900/20 text-orange-600",
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div className={`p-2 rounded-lg ${colors[color]}`}>
            <span className="material-symbols-outlined">{icon}</span>
          </div>
          <span className="text-green-600 bg-green-100 dark:bg-green-900/30 text-xs font-bold px-2 py-1 rounded-full">
            {trend}
          </span>
        </div>
        <p className="text-muted-foreground text-sm mt-4">{title}</p>
        <p className="text-3xl font-bold mt-1">{value}</p>
      </CardContent>
    </Card>
  );
}

function ActivityItem({ user, action, time }: any) {
  return (
    <div className="flex items-center justify-between py-2 border-b last:border-0">
      <div className="flex items-center gap-3">
        <Avatar className="h-8 w-8">
          <AvatarFallback>{user.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div>
          <p className="text-sm font-medium">{user}</p>
          <p className="text-xs text-muted-foreground">{action}</p>
        </div>
      </div>
      <span className="text-xs text-muted-foreground">{time}</span>
    </div>
  );
}
