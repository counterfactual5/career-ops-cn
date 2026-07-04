#!/usr/bin/env node

/**
 * cv-sync-check.mjs — Validates that the career-ops setup is consistent.
 *
 * Checks:
 * 1. cv.md exists
 * 2. config/profile.yml exists and has required fields
 * 3. No hardcoded metrics in _shared.md or batch/batch-prompt.md
 * 4. article-digest.md freshness (if exists)
 */

import { readFileSync, existsSync, statSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const projectRoot = __dirname;

const warnings = [];
const errors = [];

// 1. Check cv.md exists
const cvPath = join(projectRoot, "cv.md");
if (!existsSync(cvPath)) {
  errors.push("项目根目录未找到 cv.md。请用 markdown 格式创建你的简历。");
} else {
  const cvContent = readFileSync(cvPath, "utf-8");
  if (cvContent.trim().length < 100) {
    warnings.push("cv.md 内容似乎太短。请确保包含完整的简历。");
  }
}

// 2. Check profile.yml exists
const profilePath = join(projectRoot, "config", "profile.yml");
if (!existsSync(profilePath)) {
  errors.push(
    "未找到 config/profile.yml。请从 config/profile.example.yml 复制并填写你的信息。",
  );
} else {
  const profileContent = readFileSync(profilePath, "utf-8");
  const requiredFields = ["full_name", "email", "location"];
  for (const field of requiredFields) {
    if (
      !profileContent.includes(field) ||
      profileContent.includes(`"Jane Smith"`)
    ) {
      warnings.push(
        `config/profile.yml 可能仍包含示例数据。请检查字段：${field}`,
      );
      break;
    }
  }
}

// 3. Check for hardcoded metrics in prompt files
const filesToCheck = [
  { path: join(projectRoot, "modes", "_shared.md"), name: "_shared.md" },
  {
    path: join(projectRoot, "batch", "batch-prompt.md"),
    name: "batch-prompt.md",
  },
];

// Pattern: numbers that look like hardcoded metrics (e.g., "170+ hours", "90% self-service")
const metricPattern =
  /\b\d{2,4}\+?\s*(hours?|%|evals?|layers?|tests?|fields?|bases?)\b/gi;

for (const { path, name } of filesToCheck) {
  if (!existsSync(path)) continue;
  const content = readFileSync(path, "utf-8");

  // Skip lines that are clearly instructions (contain "NEVER hardcode" etc.)
  const lines = content.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (
      line.includes("NEVER hardcode") ||
      line.includes("NUNCA hardcode") ||
      line.startsWith("#") ||
      line.startsWith("<!--")
    )
      continue;
    const matches = line.match(metricPattern);
    if (matches) {
      warnings.push(
        `${name}:${i + 1} — 可能存在硬编码指标："${matches[0]}"，是否应从 cv.md/article-digest.md 读取？`,
      );
    }
  }
}

// 4. Check article-digest.md freshness
const digestPath = join(projectRoot, "article-digest.md");
if (existsSync(digestPath)) {
  const stats = statSync(digestPath);
  const daysSinceModified =
    (Date.now() - stats.mtimeMs) / (1000 * 60 * 60 * 24);
  if (daysSinceModified > 30) {
    warnings.push(
      `article-digest.md 已 ${Math.round(daysSinceModified)} 天未更新。如果你的项目有新指标，建议更新。`,
    );
  }
}

// Output results
console.log("\n=== career-ops-cn 同步检查 ===\n");

if (errors.length === 0 && warnings.length === 0) {
  console.log("所有检查通过。");
} else {
  if (errors.length > 0) {
    console.log(`错误 (${errors.length})：`);
    errors.forEach((e) => console.log(`  错误：${e}`));
  }
  if (warnings.length > 0) {
    console.log(`\n警告 (${warnings.length})：`);
    warnings.forEach((w) => console.log(`  警告：${w}`));
  }
}

console.log("");
process.exit(errors.length > 0 ? 1 : 0);
