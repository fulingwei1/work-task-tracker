import { TaskPriority } from "@prisma/client";

export interface ParsedTask {
  title: string;
  suggestedOwnerName?: string;
  suggestedDueDate?: string;
  priority: TaskPriority;
  acceptanceCriteria?: string;
  confidence: number;
}

export interface ParseResult {
  tasks: ParsedTask[];
  summary?: string;
}

const SYSTEM_PROMPT = `你是一个专业的会议纪要分析助手。你的任务是从会议纪要中提取行动项（任务）。

对于每个识别到的任务，你需要提取：
1. 任务标题 - 简洁明了的任务描述
2. 建议负责人 - 如果会议中提到了负责人姓名
3. 建议截止日期 - 如果会议中提到了时间节点（转换为 YYYY-MM-DD 格式）
4. 优先级 - 根据上下文判断：
   - P1（高优先级）：包含"立即"、"紧急"、"今天"、"明天"等词汇
   - P2（中优先级）：包含"本周"、"尽快"、"近期"等词汇
   - P3（低优先级）：其他情况
5. 验收标准 - 任务完成的可量化标准
6. 置信度 - 0-1之间的数值，表示你对这个任务提取的确信程度

请以JSON格式返回，格式如下：
{
  "tasks": [
    {
      "title": "任务标题",
      "suggestedOwnerName": "负责人姓名或null",
      "suggestedDueDate": "YYYY-MM-DD或null",
      "priority": "P1|P2|P3",
      "acceptanceCriteria": "验收标准或null",
      "confidence": 0.9
    }
  ],
  "summary": "会议主要内容的一句话总结"
}

注意：
- 只提取明确的行动项，不要猜测
- 如果信息不明确，对应字段返回null
- 置信度反映你对提取准确性的判断`;

export async function parseMeetingMinutes(
  content: string
): Promise<ParseResult> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return mockParse(content);
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: `请分析以下会议纪要并提取任务：\n\n${content}` },
        ],
        temperature: 0.3,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      console.error("OpenAI API 调用失败:", await response.text());
      return mockParse(content);
    }

    const data = await response.json();
    const result = JSON.parse(data.choices[0].message.content);

    return {
      tasks: result.tasks.map((task: ParsedTask) => ({
        ...task,
        priority: validatePriority(task.priority),
        confidence: Math.min(1, Math.max(0, task.confidence || 0.8)),
      })),
      summary: result.summary,
    };
  } catch (error) {
    console.error("解析会议纪要失败:", error);
    return mockParse(content);
  }
}

function validatePriority(priority: string): TaskPriority {
  if (priority === "P1" || priority === "P2" || priority === "P3") {
    return priority;
  }
  return "P2";
}

function mockParse(content: string): ParseResult {
  const tasks: ParsedTask[] = [];
  const lines = content.split("\n");

  const actionKeywords = [
    "负责",
    "完成",
    "提交",
    "跟进",
    "确认",
    "安排",
    "落实",
    "处理",
    "准备",
    "组织",
  ];
  const urgentKeywords = ["立即", "紧急", "今天", "明天", "尽快"];
  const namePattern = /([张李王刘陈杨黄赵周吴]\w{1,2})/;

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine) continue;

    const hasAction = actionKeywords.some((kw) => trimmedLine.includes(kw));
    if (!hasAction) continue;

    const nameMatch = trimmedLine.match(namePattern);
    const isUrgent = urgentKeywords.some((kw) => trimmedLine.includes(kw));

    tasks.push({
      title: trimmedLine.substring(0, 100),
      suggestedOwnerName: nameMatch ? nameMatch[1] : undefined,
      priority: isUrgent ? "P1" : "P2",
      confidence: 0.7,
    });
  }

  return {
    tasks,
    summary: "会议纪要解析完成（使用规则匹配）",
  };
}
