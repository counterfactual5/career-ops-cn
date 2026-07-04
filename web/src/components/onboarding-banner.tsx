"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Sparkles, X, Settings } from "lucide-react";

type Doctor = {
  available: boolean;
  onboardingNeeded: boolean;
  missing: string[];
  warnings: string[];
};

function hasCli(): boolean {
  try {
    return !!JSON.parse(localStorage.getItem("career-ops:config") || "{}")
      .cliId;
  } catch {
    return false;
  }
}

const LABELS: Record<string, string> = {
  "cv.md": "你的简历",
  "config/profile.yml": "你的个人配置 — 目标岗位、薪资、地点",
  "modes/_profile.md": "你的个性化策略",
};

// Detect (via the core's doctor.mjs) whether setup is incomplete, and offer to
// finish it CONVERSATIONALLY — the assistant asks in plain language and writes
// the canonical files (no YAML to edit). This is the #1 adoption barrier.
export function OnboardingBanner() {
  const [d, setD] = useState<Doctor | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [cli, setCli] = useState(true); // assume until read (avoid CTA flash)

  useEffect(() => {
    setCli(hasCli());
    fetch("/api/doctor")
      .then((r) => r.json())
      .then(setD)
      .catch(() => {});
  }, []);

  if (dismissed || !d || !d.onboardingNeeded) return null;
  const items = d.missing.map((m) => LABELS[m] ?? m);
  const kickoff = `帮我完成 career-ops-cn 的设置。我还需要添加 ${items.join(", ")} —— 请用对话方式引导我完成，并帮我写入文件。不要询问已经设置好的内容（例如，如果简历已保存，就不要再要简历）。`;

  return (
    <div className="dot-bg relative mb-6 overflow-hidden rounded-2xl border border-brand/30 bg-gradient-to-br from-brand/10 via-surface/40 to-transparent p-5">
      <button
        onClick={() => setDismissed(true)}
        className="absolute right-3 top-3 text-faint transition-colors hover:text-foreground"
        aria-label="Dismiss"
      >
        <X className="size-4" />
      </button>
      <h2 className="font-display text-xl text-landing">完成设置</h2>
      <p className="mt-1.5 max-w-xl text-sm text-muted">
        career-ops-cn 需要了解你。我们还缺少 {items.join(", ")}。{" "}
        <span className="text-foreground">无需编辑 YAML</span> ——
        用自然语言回答，助手会帮你写入。
      </p>
      {cli ? (
        <button
          onClick={() =>
            window.dispatchEvent(
              new CustomEvent("co-assistant", { detail: { message: kickoff } }),
            )
          }
          className="mt-4 inline-flex items-center gap-2 rounded-full bg-brand px-4 py-2 text-sm font-medium text-brand-foreground transition-colors hover:bg-brand-200"
        >
          <Sparkles className="size-4" /> 让助手帮我设置
        </button>
      ) : (
        <Link
          href="/config"
          className="mt-4 inline-flex items-center gap-2 rounded-full bg-brand px-4 py-2 text-sm font-medium text-brand-foreground transition-colors hover:bg-brand-200"
        >
          <Settings className="size-4" /> 先连接 AI CLI
        </Link>
      )}
    </div>
  );
}
