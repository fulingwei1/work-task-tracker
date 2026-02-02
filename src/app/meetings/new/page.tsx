import { MeetingForm } from "@/components/meeting/meeting-form";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NewMeetingPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <Link
          href="/meetings"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          返回会议列表
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">新建会议纪要</h1>
        <p className="text-gray-500 mt-1">
          粘贴会议纪要内容，创建后可使用 AI 智能拆解任务
        </p>
      </div>

      <div className="bg-white rounded-lg border p-6">
        <MeetingForm />
      </div>
    </div>
  );
}
