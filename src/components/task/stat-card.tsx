"use client";

import Link from "next/link";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  color: "primary" | "blue" | "warning" | "danger";
  href?: string;
}

const colorStyles = {
  primary: {
    icon: "bg-indigo-50 text-indigo-500",
    value: "text-indigo-600",
  },
  blue: {
    icon: "bg-blue-50 text-blue-500",
    value: "text-blue-600",
  },
  warning: {
    icon: "bg-amber-50 text-amber-500",
    value: "text-amber-600",
  },
  danger: {
    icon: "bg-red-50 text-red-500",
    value: "text-red-600",
  },
};

export function StatCard({ title, value, icon: Icon, color, href }: StatCardProps) {
  const content = (
    <div className="relative p-5 bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer">
      <div className="flex justify-between items-start mb-4">
        <span className="text-sm text-gray-500 font-medium">{title}</span>
        <div
          className={cn(
            "w-10 h-10 rounded-lg flex items-center justify-center",
            colorStyles[color].icon
          )}
        >
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <span className={cn("text-4xl font-bold", colorStyles[color].value)}>
        {value}
      </span>
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}
