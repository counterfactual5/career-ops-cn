"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";

// 首页快捷入口：点击后打开 AI 助手，引导用户发 JD 截图或粘贴文本。
// 国内招聘平台需登录，不能直接抓取 URL，所以不再提供 URL 输入框。
export function QuickEvaluate() {
  const [hint, setHint] = useState("");

  function openAssistant() {
    window.dispatchEvent(
      new CustomEvent("co-assistant", {
        detail: { message: "我想评估一个岗位 — 我可以发 JD 截图或粘贴文本。" },
      }),
    );
    setHint("已在右侧打开 AI 助手 — 直接发截图或粘贴 JD 文本即可。");
  }

  return (
    <div className="mt-7">
      <button
        onClick={openAssistant}
        className="inline-flex items-center gap-2 rounded-full bg-brand px-5 py-2.5 text-sm font-medium text-brand-foreground transition-colors hover:bg-brand-200"
      >
        <Sparkles className="size-4" />
        评估一个岗位
      </button>
      {hint && <p className="mt-2 text-xs text-faint">{hint}</p>}
    </div>
  );
}
