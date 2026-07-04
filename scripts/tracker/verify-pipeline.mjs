#!/usr/bin/env node
/**
 * verify-pipeline.mjs — Health check for career-ops pipeline integrity
 *
 * Checks:
 * 1. All statuses are canonical (per states.yml)
 * 2. No duplicate company+role entries
 * 3. All report links point to existing files
 * 4. Scores match format X.XX/5 or N/A or DUP
 * 5. All rows have proper pipe-delimited format
 * 6. No pending TSVs in tracker-additions/ (only in merged/ or archived/)
 * 7. states.yml canonical IDs for cross-system consistency
 * 8. Stale report-number reservation sentinels are garbage-collected
 * 9. No two report files cover the same company+role (warning — see #1425)
 * 10. Every report file has a tracker row referencing it (warning — see #1425)
 *
 * Run: node career-ops/verify-pipeline.mjs
 */

import {
  readFileSync,
  readdirSync,
  existsSync,
  mkdirSync,
  unlinkSync,
  statSync,
} from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const CAREER_OPS = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
// Support both layouts: data/applications.md (boilerplate) and applications.md (original).
// CAREER_OPS_TRACKER overrides the path (used by tests and non-standard layouts).
const APPS_FILE = process.env.CAREER_OPS_TRACKER
  ? process.env.CAREER_OPS_TRACKER
  : existsSync(join(CAREER_OPS, "data/applications.md"))
    ? join(CAREER_OPS, "data/applications.md")
    : join(CAREER_OPS, "applications.md");
const ADDITIONS_DIR = join(CAREER_OPS, "batch/tracker-additions");
// CAREER_OPS_REPORTS overrides the reports dir (used by tests, mirrors CAREER_OPS_TRACKER).
const REPORTS_DIR =
  process.env.CAREER_OPS_REPORTS || join(CAREER_OPS, "reports");
const STATES_FILE = existsSync(join(CAREER_OPS, "templates/states.yml"))
  ? join(CAREER_OPS, "templates/states.yml")
  : join(CAREER_OPS, "states.yml");

// Ensure required directories exist (fresh setup)
mkdirSync(join(CAREER_OPS, "data"), { recursive: true });
mkdirSync(REPORTS_DIR, { recursive: true });

const CANONICAL_STATUSES = [
  "evaluated",
  "applied",
  "responded",
  "interview",
  "offer",
  "rejected",
  "discarded",
  "skip",
];

const ALIASES = {
  evaluada: "evaluated",
  condicional: "evaluated",
  hold: "evaluated",
  evaluar: "evaluated",
  verificar: "evaluated",
  aplicado: "applied",
  enviada: "applied",
  aplicada: "applied",
  applied: "applied",
  sent: "applied",
  respondido: "responded",
  entrevista: "interview",
  oferta: "offer",
  rechazado: "rejected",
  rechazada: "rejected",
  descartado: "discarded",
  descartada: "discarded",
  cerrada: "discarded",
  cancelada: "discarded",
  "no aplicar": "skip",
  no_aplicar: "skip",
  monitor: "skip",
  "geo blocker": "skip",
  // 中文别名 (与 states.yml 保持一致)
  已评估: "evaluated",
  已投递: "applied",
  已提交: "applied",
  已回复: "responded",
  面试中: "interview",
  面试: "interview",
  已录用: "offer",
  录用: "offer",
  已拒绝: "rejected",
  拒绝: "rejected",
  已放弃: "discarded",
  放弃: "discarded",
  已关闭: "discarded",
  跳过: "skip",
  不投递: "skip",
  监控: "skip",
};

let errors = 0;
let warnings = 0;

function error(msg) {
  console.log(`❌ ${msg}`);
  errors++;
}
function warn(msg) {
  console.log(`⚠️  ${msg}`);
  warnings++;
}
function ok(msg) {
  console.log(`✅ ${msg}`);
}

// --- Read applications.md ---
if (!existsSync(APPS_FILE)) {
  console.log("\n📊 未找到 applications.md。新安装时这是正常的。");
  console.log("   评估第一个岗位后将自动创建此文件。\n");
  process.exit(0);
}
const content = readFileSync(APPS_FILE, "utf-8");
const lines = content.split("\n");

// Map columns by header name so the checks work whether the tracker uses the
// original 9-column layout or a customized one with an extra column (e.g. a
// Location column after Role). Fixed-position indexing would otherwise read
// Location where Score is expected and flag false errors. Falls back to the
// legacy fixed layout when no recognizable header row is found.
const LEGACY_COLMAP = {
  num: 1,
  date: 2,
  company: 3,
  role: 4,
  score: 5,
  status: 6,
  pdf: 7,
  report: 8,
  notes: 9,
};
const HEADER_ALIASES = {
  "#": "num",
  num: "num",
  date: "date",
  company: "company",
  empresa: "company",
  公司: "company",
  role: "role",
  puesto: "role",
  岗位: "role",
  职位: "role",
  location: "location",
  地点: "location",
  score: "score",
  评分: "score",
  status: "status",
  状态: "status",
  pdf: "pdf",
  report: "report",
  报告: "report",
  notes: "notes",
  备注: "notes",
};
function detectColumns(allLines) {
  for (const line of allLines) {
    if (!line.startsWith("|")) continue;
    const cells = line.split("|").map((s) => s.trim().toLowerCase());
    if (!cells.includes("company") && !cells.includes("公司")) continue;
    if (
      !cells.includes("role") &&
      !cells.includes("岗位") &&
      !cells.includes("职位")
    )
      continue;
    const map = {};
    cells.forEach((c, i) => {
      if (HEADER_ALIASES[c] != null) map[HEADER_ALIASES[c]] = i;
    });
    if (
      ["num", "company", "role", "score", "status"].every((k) => map[k] != null)
    )
      return map;
  }
  return null;
}
const COLMAP = detectColumns(lines) || LEGACY_COLMAP;
const MAX_IDX = Math.max(...Object.values(COLMAP));

const entries = [];
for (const line of lines) {
  if (!line.startsWith("|")) continue;
  const parts = line.split("|").map((s) => s.trim());
  if (parts.length <= MAX_IDX) continue;
  const num = parseInt(parts[COLMAP.num]);
  if (isNaN(num)) continue;
  entries.push({
    num,
    date: parts[COLMAP.date],
    company: parts[COLMAP.company],
    role: parts[COLMAP.role],
    location: COLMAP.location != null ? parts[COLMAP.location] : "",
    score: parts[COLMAP.score],
    status: parts[COLMAP.status],
    pdf: parts[COLMAP.pdf],
    report: parts[COLMAP.report],
    notes: COLMAP.notes != null ? parts[COLMAP.notes] || "" : "",
  });
}

console.log(`\n📊 正在检查 applications.md 中的 ${entries.length} 条记录\n`);

// --- Check 1: Canonical statuses ---
let badStatuses = 0;
for (const e of entries) {
  const clean = e.status.replace(/\*\*/g, "").trim().toLowerCase();
  // Strip trailing dates
  const statusOnly = clean.replace(/\s+\d{4}-\d{2}-\d{2}.*$/, "").trim();

  if (!CANONICAL_STATUSES.includes(statusOnly) && !ALIASES[statusOnly]) {
    error(`#${e.num}: 非标准状态 "${e.status}"`);
    badStatuses++;
  }

  // Check for markdown bold in status
  if (e.status.includes("**")) {
    error(`#${e.num}: 状态包含 markdown 粗体："${e.status}"`);
    badStatuses++;
  }

  // Check for dates in status
  if (/\d{4}-\d{2}-\d{2}/.test(e.status)) {
    error(`#${e.num}: 状态包含日期："${e.status}" — 日期应放在 date 列`);
    badStatuses++;
  }
}
if (badStatuses === 0) ok("所有状态均为标准状态");

// --- Check 2: Duplicates ---
const companyRoleMap = new Map();
let dupes = 0;
for (const e of entries) {
  const key =
    e.company.toLowerCase().replace(/[^\p{L}\p{N}]/gu, "") +
    "::" +
    e.role.toLowerCase().replace(/[^\p{L}\p{N} ]/gu, "");
  if (!companyRoleMap.has(key)) companyRoleMap.set(key, []);
  companyRoleMap.get(key).push(e);
}
for (const [key, group] of companyRoleMap) {
  if (group.length > 1) {
    warn(
      `可能重复：${group.map((e) => `#${e.num}`).join(", ")} (${group[0].company} — ${group[0].role})`,
    );
    dupes++;
  }
}
if (dupes === 0) ok("未发现精确重复");

// --- Check 3: Report links ---
// Markdown links resolve relative to the file that contains them, so report
// links must resolve against the tracker's own directory (see #760). For the
// transition we also accept legacy root-relative links: try the tracker dir
// first, then fall back to the repo root before flagging a link broken.
const TRACKER_DIR = dirname(APPS_FILE);
let brokenReports = 0;
for (const e of entries) {
  const match = e.report.match(/\]\(([^)]+)\)/);
  if (!match) continue;
  const link = match[1];
  if (
    !existsSync(join(TRACKER_DIR, link)) &&
    !existsSync(join(CAREER_OPS, link))
  ) {
    error(`#${e.num}: 报告未找到：${link}`);
    brokenReports++;
  }
}
if (brokenReports === 0) ok("所有报告链接有效");

// --- Check 4: Score format ---
let badScores = 0;
for (const e of entries) {
  const s = e.score.replace(/\*\*/g, "").trim();
  if (!/^\d+\.?\d*\/5$/.test(s) && s !== "N/A" && s !== "DUP") {
    error(`#${e.num}: 无效评分格式："${e.score}"`);
    badScores++;
  }
}
if (badScores === 0) ok("所有评分格式有效");

// --- Check 5: Row format ---
let badRows = 0;
for (const line of lines) {
  if (!line.startsWith("|")) continue;
  if (line.includes("---") || line.includes("Empresa") || line.includes("公司"))
    continue;
  const parts = line.split("|");
  if (parts.length <= MAX_IDX) {
    error(`行列数不足（需要 ${MAX_IDX} 列数据）：${line.substring(0, 80)}...`);
    badRows++;
  }
}
if (badRows === 0) ok("所有行格式正确");

// --- Check 6: Pending TSVs ---
let pendingTsvs = 0;
if (existsSync(ADDITIONS_DIR)) {
  const files = readdirSync(ADDITIONS_DIR).filter((f) => f.endsWith(".tsv"));
  pendingTsvs = files.length;
  if (pendingTsvs > 0) {
    warn(`${pendingTsvs} 个待合并 TSV 在 tracker-additions/ 中`);
  }
}
if (pendingTsvs === 0) ok("无待合并 TSV");

// --- Check 7: Bold in scores ---
let boldScores = 0;
for (const e of entries) {
  if (e.score.includes("**")) {
    warn(`#${e.num}: 评分包含 markdown 粗体："${e.score}"`);
    boldScores++;
  }
}
if (boldScores === 0) ok("评分中无粗体标记");

// --- Check 8: Stale report-number sentinels (GC) ---
// reserve-report-num.mjs drops NNN-RESERVED.md files in reports/ when a
// number is claimed.  If the process crashed before writing the real report
// and deleting the sentinel it will linger.  Sentinels older than 4 h are
// stale; remove them here so they don't skew the next slot allocation.
const SENTINEL_MAX_AGE_MS = 4 * 60 * 60 * 1000;
let staleSentinels = 0;
if (existsSync(REPORTS_DIR)) {
  const now = Date.now();
  for (const name of readdirSync(REPORTS_DIR)) {
    if (!name.endsWith("-RESERVED.md")) continue;
    const full = join(REPORTS_DIR, name);
    try {
      const { mtimeMs } = statSync(full);
      if (now - mtimeMs > SENTINEL_MAX_AGE_MS) {
        unlinkSync(full);
        warn(`已删除过期保留标记：${name}`);
        staleSentinels++;
      }
    } catch {
      // Already gone between readdir and stat — fine.
    }
  }
}
if (staleSentinels === 0) ok("无过期保留标记");

// --- Check 9: Duplicate reports for the same company+role (#1425) ---
// Two concurrent evaluators can each write a report for the same role.
// merge-tracker dedups the TRACKER, but nothing watched reports/ itself.
// Warning-level, not error: duplicates can be legitimate (re-evaluation
// after a JD change).
const REPORT_FILE_RE = /^(\d+)-(.+)-\d{4}-\d{2}-\d{2}\.md$/;
const normalizeKey = (s) => s.toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");

// Role comes from the report body: the Machine Summary YAML fence when
// present (field names are exact by contract), else the title line
// "# 评估：{Company} — {Role}" (or legacy "# Evaluación: …"). Reports where neither parses are
// skipped rather than grouped by company alone, which would false-positive
// on two different roles at the same company.
function extractRole(reportContent) {
  const fence = reportContent.match(
    /##\s*Machine Summary\s*\n+```(?:yaml|yml|json)?\s*\n([\s\S]*?)\n```/i,
  );
  if (fence) {
    const m = fence[1].match(/^role:\s*["']?(.+?)["']?\s*$/m);
    if (m && m[1].trim()) return m[1].trim();
  }
  const title = reportContent.split("\n").find((l) => l.startsWith("# "));
  if (title) {
    const parts = title.split(/[—–]/);
    if (parts.length >= 2 && parts[parts.length - 1].trim())
      return parts[parts.length - 1].trim();
  }
  return null;
}

const reportFiles = existsSync(REPORTS_DIR)
  ? readdirSync(REPORTS_DIR).filter((f) => REPORT_FILE_RE.test(f))
  : [];

let dupReports = 0;
const reportsByRole = new Map();
for (const name of reportFiles) {
  const companySlug = name.match(REPORT_FILE_RE)[2];
  let role = null;
  try {
    role = extractRole(readFileSync(join(REPORTS_DIR, name), "utf-8"));
  } catch {
    // Unreadable report — the orphan check below still sees it.
  }
  if (!role) continue;
  const key = normalizeKey(companySlug) + "::" + normalizeKey(role);
  if (!reportsByRole.has(key)) reportsByRole.set(key, []);
  reportsByRole.get(key).push(name);
}
for (const group of reportsByRole.values()) {
  if (group.length > 1) {
    warn(`同一公司+岗位存在重复报告：${group.join(", ")}`);
    dupReports++;
  }
}
if (dupReports === 0) ok("无同一公司+岗位的重复报告");

// --- Check 10: Orphan reports with no tracker row (#1425) ---
// Every reports/NNN-*.md should be referenced by a tracker row — by the row's
// own number, the [NNN] link text, or the NNN- prefix of the linked filename.
// A report none of them reference is usually the loser of a tracker dedup.
const referencedNums = new Set();
for (const e of entries) {
  referencedNums.add(e.num);
  const linkText = e.report.match(/\[(\d+)\]/);
  if (linkText) referencedNums.add(parseInt(linkText[1], 10));
  const linkTarget = e.report.match(/\]\(([^)]+)\)/);
  if (linkTarget) {
    const m = linkTarget[1]
      .split("/")
      .pop()
      .match(/^(\d+)-/);
    if (m) referencedNums.add(parseInt(m[1], 10));
  }
}

let orphanReports = 0;
for (const name of reportFiles) {
  const num = parseInt(name.match(REPORT_FILE_RE)[1], 10);
  if (!referencedNums.has(num)) {
    warn(`孤儿报告 — 无追踪行引用 #${num}：reports/${name}`);
    orphanReports++;
  }
}
if (orphanReports === 0) ok("无孤儿报告");

// --- Summary ---
console.log("\n" + "=".repeat(50));
console.log(`📊 待办健康度：${errors} 个错误，${warnings} 个警告`);
if (errors === 0 && warnings === 0) {
  console.log("🟢 待办状态干净！");
} else if (errors === 0) {
  console.log("🟡 待办正常，但有警告");
} else {
  console.log("🔴 待办存在错误 — 请修复后再继续");
}

process.exit(errors > 0 ? 1 : 0);
