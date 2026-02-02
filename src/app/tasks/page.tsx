export default function TasksPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">任务列表</h1>
          <p className="text-gray-500 mt-1">管理和跟踪您的所有任务</p>
        </div>
        <button className="bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-600 transition-colors">
          创建任务
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <p className="text-gray-500">任务列表将在任务 4 中实现...</p>
      </div>
    </div>
  );
}
