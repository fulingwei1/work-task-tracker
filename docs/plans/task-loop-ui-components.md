# AI 任务闭环管理系统 - UI 组件代码示例

> 本文档包含核心组件的 React + TypeScript + Tailwind CSS 实现示例

---

## 一、设计系统 CSS 变量

```css
/* globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    /* 主色 */
    --primary: 99 102 241;
    --primary-foreground: 255 255 255;
    
    /* 语义色 */
    --success: 16 185 129;
    --warning: 245 158 11;
    --danger: 239 68 68;
    
    /* 中性色 */
    --background: 249 250 251;
    --foreground: 17 24 39;
    --card: 255 255 255;
    --card-foreground: 17 24 39;
    --muted: 107 114 128;
    --border: 229 231 235;
    
    /* 优先级 */
    --priority-p1: 220 38 38;
    --priority-p2: 245 158 11;
    --priority-p3: 107 114 128;
    
    /* 圆角 */
    --radius: 0.75rem;
  }
  
  .dark {
    --background: 17 24 39;
    --foreground: 249 250 251;
    --card: 31 41 55;
    --card-foreground: 249 250 251;
    --border: 55 65 81;
  }
}

/* 字体引入 */
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
```

---

## 二、统计卡片组件

```tsx
// components/stat-card.tsx
'use client';

import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: number;
  change?: string;
  trend?: 'up' | 'down';
  icon: LucideIcon;
  color?: 'primary' | 'success' | 'warning' | 'danger';
}

export function StatCard({ 
  title, 
  value, 
  change, 
  trend, 
  icon: Icon,
  color = 'primary' 
}: StatCardProps) {
  const colorStyles = {
    primary: {
      icon: 'bg-indigo-50 text-indigo-500',
      decoration: 'bg-indigo-500',
    },
    success: {
      icon: 'bg-emerald-50 text-emerald-500',
      decoration: 'bg-emerald-500',
    },
    warning: {
      icon: 'bg-amber-50 text-amber-500',
      decoration: 'bg-amber-500',
    },
    danger: {
      icon: 'bg-red-50 text-red-500',
      decoration: 'bg-red-500',
    },
  };

  return (
    <motion.div
      className="relative p-5 bg-white rounded-xl border border-gray-200 overflow-hidden cursor-pointer"
      whileHover={{ 
        y: -2, 
        boxShadow: '0 20px 40px rgba(0,0,0,0.08)' 
      }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
    >
      {/* 头部 */}
      <div className="flex justify-between items-start mb-4">
        <span className="text-sm text-gray-500 font-medium">{title}</span>
        <div className={cn(
          'w-10 h-10 rounded-lg flex items-center justify-center',
          colorStyles[color].icon
        )}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      
      {/* 数值 */}
      <div className="flex items-end gap-3">
        <motion.span 
          className="text-4xl font-bold text-gray-900 font-display"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          {value}
        </motion.span>
        
        {change && (
          <div className={cn(
            'flex items-center gap-1 text-sm font-medium mb-1',
            trend === 'up' ? 'text-emerald-500' : 'text-red-500'
          )}>
            <span>{trend === 'up' ? '↑' : '↓'}</span>
            <span>{change}</span>
          </div>
        )}
      </div>
      
      {/* 背景装饰 */}
      <motion.div 
        className={cn(
          'absolute -right-5 -bottom-5 w-28 h-28 rounded-full opacity-5',
          colorStyles[color].decoration
        )}
        whileHover={{ scale: 1.1 }}
        transition={{ duration: 0.3 }}
      />
    </motion.div>
  );
}
```

---

## 三、任务卡片组件

```tsx
// components/task-card.tsx
'use client';

import { motion } from 'framer-motion';
import { Calendar, User, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar } from './avatar';
import { StatusBadge } from './status-badge';
import { ProgressRing } from './progress-ring';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

interface Task {
  id: string;
  title: string;
  priority: 'P1' | 'P2' | 'P3';
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'PENDING_REVIEW' | 'COMPLETED' | 'BLOCKED';
  dueDate: string;
  progress: number;
  owner: {
    name: string;
    avatar?: string;
  };
  collaborators?: Array<{ name: string; avatar?: string }>;
}

interface TaskCardProps {
  task: Task;
  onEdit?: () => void;
  onUpdateProgress?: () => void;
  onDelete?: () => void;
}

const priorityColors = {
  P1: 'bg-red-500',
  P2: 'bg-amber-500',
  P3: 'bg-gray-400',
};

export function TaskCard({ task, onEdit, onUpdateProgress, onDelete }: TaskCardProps) {
  return (
    <motion.div
      className="bg-white rounded-xl border border-gray-200 p-4 hover:border-gray-300 transition-colors cursor-pointer"
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2, boxShadow: '0 12px 24px rgba(0,0,0,0.06)' }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-center gap-4">
        {/* 左侧：优先级指示器 + 复选框 */}
        <div className="flex items-center gap-3">
          <div className={cn(
            'w-1 h-8 rounded-full',
            priorityColors[task.priority]
          )} />
          <input 
            type="checkbox" 
            checked={task.status === 'COMPLETED'}
            onChange={() => {}}
            className="w-5 h-5 rounded-md border-gray-300 text-indigo-500 focus:ring-indigo-500"
          />
        </div>
        
        {/* 中间：任务内容 */}
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-gray-900 truncate mb-2">
            {task.title}
          </h3>
          
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {task.dueDate}
            </span>
            <span className="flex items-center gap-1">
              <User className="w-3.5 h-3.5" />
              {task.owner.name}
            </span>
            {task.collaborators && task.collaborators.length > 0 && (
              <div className="flex -space-x-2">
                {task.collaborators.slice(0, 3).map((c, i) => (
                  <Avatar key={i} src={c.avatar} name={c.name} size="xs" />
                ))}
                {task.collaborators.length > 3 && (
                  <span className="text-xs text-gray-400">
                    +{task.collaborators.length - 3}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
        
        {/* 右侧：状态 + 进度 + 操作 */}
        <div className="flex items-center gap-4">
          <StatusBadge status={task.status} />
          <ProgressRing progress={task.progress} size={36} />
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <MoreHorizontal className="w-5 h-5 text-gray-400" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit}>编辑任务</DropdownMenuItem>
              <DropdownMenuItem onClick={onUpdateProgress}>更新进度</DropdownMenuItem>
              <DropdownMenuItem onClick={onDelete} className="text-red-500">
                删除任务
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </motion.div>
  );
}
```

---

## 四、状态徽章组件

```tsx
// components/status-badge.tsx
import { cn } from '@/lib/utils';

type Status = 'NOT_STARTED' | 'IN_PROGRESS' | 'PENDING_REVIEW' | 'COMPLETED' | 'BLOCKED' | 'CANCELLED';

interface StatusBadgeProps {
  status: Status;
  size?: 'sm' | 'md';
}

const statusConfig: Record<Status, { label: string; className: string }> = {
  NOT_STARTED: {
    label: '未开始',
    className: 'bg-gray-100 text-gray-600',
  },
  IN_PROGRESS: {
    label: '进行中',
    className: 'bg-blue-50 text-blue-600',
  },
  PENDING_REVIEW: {
    label: '待验收',
    className: 'bg-amber-50 text-amber-600',
  },
  COMPLETED: {
    label: '已完成',
    className: 'bg-emerald-50 text-emerald-600',
  },
  BLOCKED: {
    label: '已阻塞',
    className: 'bg-red-50 text-red-600',
  },
  CANCELLED: {
    label: '已取消',
    className: 'bg-gray-100 text-gray-400',
  },
};

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const config = statusConfig[status];
  
  return (
    <span className={cn(
      'inline-flex items-center font-semibold rounded-full',
      size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-xs',
      config.className
    )}>
      {config.label}
    </span>
  );
}
```

---

## 五、进度环组件

```tsx
// components/progress-ring.tsx
'use client';

import { motion } from 'framer-motion';

interface ProgressRingProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
}

export function ProgressRing({ 
  progress, 
  size = 36, 
  strokeWidth = 3 
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        {/* 背景圆 */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgb(229 231 235)"
          strokeWidth={strokeWidth}
        />
        {/* 进度圆 */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgb(99 102 241)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          style={{
            strokeDasharray: circumference,
          }}
        />
      </svg>
      {/* 中心文字 */}
      <span className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold text-gray-700 font-mono">
        {progress}%
      </span>
    </div>
  );
}
```

---

## 六、按钮组件

```tsx
// components/ui/button.tsx
import { forwardRef } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends HTMLMotionProps<'button'> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

const variants = {
  primary: 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-[0_4px_14px_rgba(99,102,241,0.39)] hover:shadow-[0_6px_20px_rgba(99,102,241,0.5)]',
  secondary: 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:border-gray-400',
  ghost: 'bg-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-900',
  danger: 'bg-red-500 text-white hover:bg-red-600',
};

const sizes = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-base',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant = 'primary', 
    size = 'md', 
    loading, 
    icon,
    fullWidth,
    children, 
    disabled,
    ...props 
  }, ref) => {
    return (
      <motion.button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center gap-2 font-semibold rounded-lg transition-all',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          variants[variant],
          sizes[size],
          fullWidth && 'w-full',
          className
        )}
        disabled={disabled || loading}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        {...props}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : icon ? (
          <span className="w-4 h-4">{icon}</span>
        ) : null}
        {children}
      </motion.button>
    );
  }
);

Button.displayName = 'Button';
```

---

## 七、移动端底部导航

```tsx
// components/mobile/bottom-nav.tsx
'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Home, ClipboardList, Plus, Bell, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  id: string;
  icon: React.ReactNode;
  label: string;
  badge?: number;
}

const navItems: NavItem[] = [
  { id: 'home', icon: <Home />, label: '工作台' },
  { id: 'tasks', icon: <ClipboardList />, label: '任务', badge: 5 },
  { id: 'create', icon: <Plus />, label: '创建' },
  { id: 'notifications', icon: <Bell />, label: '通知', badge: 3 },
  { id: 'profile', icon: <User />, label: '我的' },
];

export function BottomNav() {
  const [activeTab, setActiveTab] = useState('home');

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-[60px] bg-white/90 backdrop-blur-xl border-t border-gray-200 flex items-center justify-around pb-safe z-50">
      {navItems.map((item) => (
        item.id === 'create' ? (
          // 中间突出的创建按钮
          <div key={item.id} className="relative -top-4">
            <motion.button
              className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-indigo-500/40"
              whileTap={{ scale: 0.95 }}
            >
              <Plus className="w-6 h-6" />
            </motion.button>
          </div>
        ) : (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={cn(
              'flex flex-col items-center justify-center w-16 h-12 transition-colors relative',
              activeTab === item.id ? 'text-indigo-500' : 'text-gray-400'
            )}
          >
            <span className={cn(
              'w-6 h-6 transition-transform',
              activeTab === item.id && 'scale-110'
            )}>
              {item.icon}
            </span>
            <span className="text-[10px] font-medium mt-0.5">{item.label}</span>
            
            {/* 徽章 */}
            {item.badge && (
              <span className="absolute top-0.5 right-3 min-w-[16px] h-4 px-1 bg-red-500 text-white text-[10px] font-semibold rounded-full flex items-center justify-center">
                {item.badge}
              </span>
            )}
          </button>
        )
      ))}
    </nav>
  );
}
```

---

## 八、移动端任务卡片（带手势）

```tsx
// components/mobile/task-card-mobile.tsx
'use client';

import { useState } from 'react';
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { Calendar, Check, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar } from '../avatar';
import { StatusBadge } from '../status-badge';

interface MobileTaskCardProps {
  task: {
    id: string;
    title: string;
    priority: 'P1' | 'P2' | 'P3';
    status: string;
    dueDate: string;
    owner: { name: string; avatar?: string };
  };
  onComplete?: () => void;
  onDelete?: () => void;
}

const priorityColors = {
  P1: 'bg-red-500',
  P2: 'bg-amber-500',
  P3: 'bg-gray-400',
};

export function MobileTaskCard({ task, onComplete, onDelete }: MobileTaskCardProps) {
  const [isDragging, setIsDragging] = useState(false);
  const x = useMotionValue(0);
  const actionOpacity = useTransform(x, [-100, -50, 0], [1, 0.5, 0]);

  const handleDragEnd = (event: MouseEvent | TouchEvent, info: PanInfo) => {
    setIsDragging(false);
    if (info.offset.x < -100) {
      // 显示操作按钮
    } else {
      x.set(0);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-xl mb-3">
      {/* 滑动显示的操作按钮 */}
      <motion.div 
        className="absolute right-0 top-0 bottom-0 flex"
        style={{ opacity: actionOpacity }}
      >
        <button 
          onClick={onComplete}
          className="w-20 bg-emerald-500 flex items-center justify-center text-white"
        >
          <Check className="w-6 h-6" />
        </button>
        <button 
          onClick={onDelete}
          className="w-20 bg-red-500 flex items-center justify-center text-white"
        >
          <Trash2 className="w-6 h-6" />
        </button>
      </motion.div>

      {/* 卡片主体 */}
      <motion.div
        className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3"
        style={{ x }}
        drag="x"
        dragConstraints={{ left: -160, right: 0 }}
        dragElastic={0.1}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={handleDragEnd}
      >
        {/* 优先级点 */}
        <div className={cn(
          'w-2.5 h-2.5 rounded-full flex-shrink-0',
          priorityColors[task.priority]
        )} />
        
        {/* 内容 */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 truncate mb-1.5">
            {task.title}
          </h3>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-xs text-gray-500">
              <Calendar className="w-3 h-3" />
              {task.dueDate}
            </span>
            <StatusBadge status={task.status as any} size="sm" />
          </div>
        </div>
        
        {/* 头像 */}
        <Avatar src={task.owner.avatar} name={task.owner.name} size="sm" />
      </motion.div>
    </div>
  );
}
```

---

## 九、骨架屏组件

```tsx
// components/skeleton.tsx
import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] animate-shimmer rounded',
        className
      )}
    />
  );
}

// 任务卡片骨架
export function TaskCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
      <Skeleton className="w-1 h-8" />
      <Skeleton className="w-5 h-5 rounded" />
      <div className="flex-1">
        <Skeleton className="h-4 w-3/4 mb-2" />
        <Skeleton className="h-3 w-1/2" />
      </div>
      <Skeleton className="w-16 h-6 rounded-full" />
      <Skeleton className="w-9 h-9 rounded-full" />
    </div>
  );
}
```

```css
/* 添加到 globals.css */
@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

.animate-shimmer {
  animation: shimmer 1.5s ease-in-out infinite;
}
```

---

## 十、Tailwind 配置扩展

```js
// tailwind.config.js
const config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        body: ['Noto Sans SC', 'PingFang SC', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      colors: {
        primary: {
          50: '#EEF2FF',
          100: '#E0E7FF',
          200: '#C7D2FE',
          300: '#A5B4FC',
          400: '#818CF8',
          500: '#6366F1',
          600: '#4F46E5',
          700: '#4338CA',
          800: '#3730A3',
          900: '#312E81',
        },
      },
      boxShadow: {
        'card': '0 0 0 1px rgba(0, 0, 0, 0.03), 0 2px 4px rgba(0, 0, 0, 0.05), 0 12px 24px rgba(0, 0, 0, 0.05)',
        'primary': '0 4px 14px 0 rgba(99, 102, 241, 0.39)',
      },
      animation: {
        'shimmer': 'shimmer 1.5s ease-in-out infinite',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
};

export default config;
```

---

> 这些组件代码可以直接用于你的 Next.js 项目，配合 Framer Motion 实现精致的动效。
