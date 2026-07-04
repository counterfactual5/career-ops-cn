"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CircleHelp, ArrowRight } from "lucide-react";
import { instrumentSerif } from "@/lib/fonts";
import { HeroGlow } from "@/components/hero-glow";
import type { Application, InboxJob } from "@/lib/career-ops";
import { DecisionCard } from "@/components/home/decision-card";
import { QuickEvaluate } from "@/components/quick-evaluate";

// 今日行动看板 — 展示已评分但未决策的岗位。
// 这是一个纯 VIEW 层：所有动作都 dispatch 到 registry action / route。
export function TodayDashboard({
  applications,
  inbox,
  inBetween,
}: {
  applications: Application[];
  inbox: InboxJob[];
  inBetween: boolean;
}) {
  const router = useRouter();
  const dateLabel = useMemo(
    () =>
      new Date().toLocaleDateString("zh-CN", {
        weekday: "long",
        month: "short",
        day: "numeric",
      }),
    [],
  );

  useEffect(() => {
    // 评估/PDF worker 写入 tracker 后，刷新服务端快照让新评分出现
    const onDone = () => router.refresh();
    window.addEventListener("co-job-done", onDone);
    return () => window.removeEventListener("co-job-done", onDone);
  }, [router]);

  // 等你决策：已评分（Evaluated）但还没进入终态
  const awaiting = useMemo(
    () => applications.filter((a) => /^evaluat/i.test(a.status)).slice(0, 6),
    [applications],
  );

  const allClear = awaiting.length === 0 && inbox.length === 0;

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <section className="dot-bg relative overflow-hidden rounded-2xl border border-border bg-surface/40 px-7 py-10 md:px-10 md:py-12">
        <HeroGlow />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-[1] bg-surface/55 backdrop-blur-[2px] dark:bg-background/45"
        />
        <div className="relative z-10">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
            <span className="text-faint">//</span> 今日 ·{" "}
            <span className="tabular-nums">{dateLabel}</span>
          </p>
          <h1
            className={`${instrumentSerif.className} mt-3 text-4xl leading-[1.05] text-landing md:text-5xl`}
          >
            {allClear ? (
              <>全部已处理完毕。</>
            ) : (
              <>
                <span className="text-brand tabular-nums">
                  {awaiting.length}
                </span>{" "}
                个岗位等你决策
              </>
            )}
          </h1>
          <p className="mt-4 max-w-xl text-sm text-muted">
            {allClear
              ? "看到感兴趣的岗位，截图或粘贴发过来即可评估。"
              : "今日行动队列 — 已评分的岗位，决定是否投递。"}
          </p>
          <div className="mt-6 flex flex-wrap gap-2.5">
            <Link
              href="/pipeline"
              className="inline-flex items-center gap-2 rounded-full bg-brand px-5 py-2.5 text-sm font-medium text-brand-foreground transition hover:bg-brand-200"
            >
              打开待办 <ArrowRight className="size-4" />
            </Link>
          </div>
          {inBetween && <QuickEvaluate />}
        </div>
      </section>

      {/* 等你决策 */}
      {awaiting.length > 0 && (
        <Section icon={CircleHelp} title="等你决策" hint="已评分 — 投递或跳过">
          <div className="grid gap-2.5 sm:grid-cols-2">
            {awaiting.map((a) => (
              <DecisionCard key={a.n} app={a} />
            ))}
          </div>
        </Section>
      )}

      {allClear && (
        <div className="mt-8 rounded-2xl border border-border bg-surface/30 px-6 py-10 text-center">
          <p className="mx-auto mt-3 max-w-md text-sm text-muted">
            暂时没有需要你处理的事项。查看你的{" "}
            <Link href="/pipeline" className="text-brand hover:underline">
              待办
            </Link>
            ，或粘贴一个 JD 开始评估。
          </p>
        </div>
      )}
    </div>
  );
}

function Section({
  icon: Icon,
  title,
  hint,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-10">
      <div className="mb-3 flex items-center gap-2">
        <Icon className="size-4 text-brand" />
        <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-muted">
          {title}
        </h2>
        <span className="text-xs text-faint">· {hint}</span>
      </div>
      {children}
    </section>
  );
}
