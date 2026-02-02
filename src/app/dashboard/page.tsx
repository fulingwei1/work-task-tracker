export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">工作台</h1>
        <p className="text-gray-500 mt-1">欢迎回来，查看您的任务概览</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="待办任务" value={12} color="primary" />
        <StatCard title="进行中" value={8} color="blue" />
        <StatCard title="本周到期" value={3} color="warning" />
        <StatCard title="已逾期" value={2} color="danger" />
      </div>

      {/* Placeholder for task list */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">待办任务</h2>
        <p className="text-gray-500">任务列表将在后续任务中实现...</p>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  color,
}: {
  title: string;
  value: number;
  color: "primary" | "blue" | "warning" | "danger";
}) {
  const colorMap = {
    primary: "bg-indigo-50 text-indigo-600",
    blue: "bg-blue-50 text-blue-600",
    warning: "bg-amber-50 text-amber-600",
    danger: "bg-red-50 text-red-600",
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow cursor-pointer">
      <p className="text-sm text-gray-500 font-medium">{title}</p>
      <p className={`text-3xl font-bold mt-2 ${colorMap[color]}`}>{value}</p>
    </div>
  );
}
