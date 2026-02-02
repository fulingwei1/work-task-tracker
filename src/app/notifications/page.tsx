export default function NotificationsPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">通知中心</h1>
          <p className="text-gray-500 mt-1">查看您的所有通知消息</p>
        </div>
        <button className="text-indigo-500 text-sm font-medium hover:text-indigo-600 transition-colors">
          全部标记已读
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <p className="text-gray-500">通知列表将在任务 5 中实现...</p>
      </div>
    </div>
  );
}
