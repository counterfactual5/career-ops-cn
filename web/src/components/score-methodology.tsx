import { ChevronDown, ExternalLink } from "lucide-react";

// Transparency = our differentiator ("why it's a 4.0 for YOU"). The wording is
// the CANONICAL public text from career-ops.org/methodology + /docs — rendered
// verbatim, NOT a web reinterpretation of the rubric (whose weights live in the
// core, modes/_shared.md). Native <details> → no client JS.

const DIMENSIONS: [string, string][] = [
  ["匹配度", "简历与职位要求的契合程度"],
  ["目标一致性", "该职位对实现你职业目标的推进程度"],
  ["薪酬竞争力", "offer 与市场行情对比（数据不足时提示“信息不充分” — 永不捏造数字）"],
  ["文化信号", "团队、价值观和工作方式信号"],
  ["风险提示", "幽灵职位、诈骗或不匹配预警"],
  ["整体评分", "综合以上维度的单一判断"],
];

const BLOCKS: [string, string][] = [
  ["A", "职位概述（通俗语言）"],
  ["B", "简历与各要求的匹配表，以及差距"],
  ["C", "策略 — 如何为此职位定位自己"],
  ["D", "薪酬调研，对比 offer 与市场行情"],
  ["E", "申请个性化笔记"],
  ["F", "面试准备 — 针对此职位的 STAR 故事"],
  ["G", "职位真实性 — 检查招聘是否真实、非诈骗或幽灵职位"],
];

export function ScoreMethodology() {
  return (
    <details className="group mt-10 overflow-hidden rounded-2xl border border-border bg-surface/30">
      <summary className="flex cursor-pointer list-none items-center gap-2 px-5 py-3.5 text-sm font-medium transition-colors hover:bg-surface-hover">
        career-ops-cn 如何评分此职位 — 为什么适合 <span className="text-landing">你</span>
        <ChevronDown className="ml-auto size-4 text-faint transition-transform group-open:rotate-180" />
      </summary>
      <div className="space-y-5 border-t border-border px-5 py-4 text-sm">
        <p className="text-muted">
          每个职位在六个维度上评分 <strong className="text-foreground">1.0–5.0</strong>。{" "}
          <strong className="text-brand">4.0</strong> 是投递/不投递的分界线 — 低于此分，career-ops-cn 建议不投递。
        </p>
        <div>
          <div className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-faint">六个维度</div>
          <ul className="space-y-1.5">
            {DIMENSIONS.map(([k, v]) => (
              <li key={k}>
                <span className="font-medium text-foreground">{k}</span> <span className="text-muted">— {v}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <div className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-faint">每个报告块的含义</div>
          <ul className="space-y-2">
            {BLOCKS.map(([k, v]) => (
              <li key={k} className="flex items-start gap-2.5">
                <span className="mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded bg-brand-soft text-xs font-semibold text-brand">
                  {k}
                </span>
                <span className="text-muted">{v}</span>
              </li>
            ))}
          </ul>
        </div>
        <a
          href="https://career-ops.org/methodology"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-xs text-brand transition-colors hover:underline"
        >
          完整方法论 <ExternalLink className="size-3" />
        </a>
      </div>
    </details>
  );
}
