#!/usr/bin/env node

/**
 * doctor.mjs — career-ops-cn 项目健康检查
 * 检查所有前提条件并打印通过/失败清单。
 */

import { existsSync, mkdirSync, readdirSync, readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2);
const targetIdx = argv.indexOf("--target");
const projectRoot =
  targetIdx !== -1 && argv[targetIdx + 1]
    ? argv[targetIdx + 1]
    : join(__dirname, "..", "..");
const JSON_OUT = argv.includes("--json");

// ANSI 颜色（仅在 TTY 下）
const isTTY = process.stdout.isTTY;
const green = (s) => (isTTY ? `\x1b[32m${s}\x1b[0m` : s);
const red = (s) => (isTTY ? `\x1b[31m${s}\x1b[0m` : s);
const yellow = (s) => (isTTY ? `\x1b[33m${s}\x1b[0m` : s);
const dim = (s) => (isTTY ? `\x1b[2m${s}\x1b[0m` : s);

function checkNodeVersion() {
  const major = parseInt(process.versions.node.split(".")[0]);
  if (major >= 18) {
    return { pass: true, label: `Node.js >= 18 (v${process.versions.node})` };
  }
  return {
    pass: false,
    label: `Node.js >= 18 (当前 v${process.versions.node})`,
    fix: "请从 https://nodejs.org 安装 Node.js 18 或更高版本",
  };
}

function checkDependencies() {
  if (existsSync(join(projectRoot, "node_modules"))) {
    return { pass: true, label: "依赖已安装" };
  }
  return {
    pass: false,
    label: "依赖未安装",
    fix: "运行：npm install",
  };
}

// 用户层文件前提条件（cv.md / config/profile.yml 等）
const USER_LAYER_PREREQS = [
  { path: "cv.md", label: "简历文件 (cv.md)" },
  { path: "config/profile.yml", label: "个人配置 (config/profile.yml)" },
];

function checkPrereq({ path, label }) {
  const fullPath = join(projectRoot, path);
  if (existsSync(fullPath)) {
    return { pass: true, label: `${label} 已就绪` };
  }
  return {
    pass: false,
    label: `${label} 缺失`,
    fix: `创建 ${path}（可参考 ${path.replace(/\.yml$/, ".example.yml").replace(/^cv/, "templates/cv-template")})`,
  };
}

function checkFonts() {
  const fontsDir = join(projectRoot, "fonts");
  if (!existsSync(fontsDir)) {
    return { pass: true, label: "字体目录不存在（PDF 生成功能不可用）" };
  }
  const fonts = readdirSync(fontsDir);
  if (fonts.length > 0) {
    return { pass: true, label: `字体已安装 (${fonts.length} 个)` };
  }
  return {
    pass: false,
    label: "字体目录为空",
    fix: "PDF 生成需要字体文件，请检查 fonts/ 目录",
  };
}

function checkAutoDir(name) {
  const dir = join(projectRoot, name);
  if (existsSync(dir)) {
    return { pass: true, label: `${name}/ 目录就绪` };
  }
  try {
    mkdirSync(dir, { recursive: true });
    return { pass: true, label: `${name}/ 目录已自动创建` };
  } catch {
    return {
      pass: false,
      label: `${name}/ 目录无法创建`,
      fix: `手动创建：mkdir -p ${name}`,
    };
  }
}

function checkPipelineFile() {
  const file = join(projectRoot, "data/pipeline.md");
  if (existsSync(file)) {
    return { pass: true, label: "data/pipeline.md 已存在" };
  }
  return {
    pass: true,
    label: "data/pipeline.md 尚未创建（首次使用时自动生成）",
  };
}

function checkModes() {
  const modesDir = join(projectRoot, "modes");
  const requiredFiles = ["_shared.md", "oferta.md", "apply.md", "pipeline.md"];
  const missing = requiredFiles.filter((f) => !existsSync(join(modesDir, f)));
  if (missing.length === 0) {
    return { pass: true, label: "modes/ 评估体系完整" };
  }
  return {
    pass: false,
    label: `modes/ 缺失文件：${missing.join(", ")}`,
    fix: "请从仓库重新拉取 modes/ 目录",
  };
}

async function main() {
  const checks = [
    checkNodeVersion(),
    checkDependencies(),
    checkModes(),
    ...USER_LAYER_PREREQS.map(checkPrereq),
    checkFonts(),
    checkAutoDir("data"),
    checkPipelineFile(),
    checkAutoDir("output"),
    checkAutoDir("reports"),
    checkAutoDir("jds"),
  ];

  if (JSON_OUT) {
    const result = {
      all_passed: checks.every((c) => c.pass),
      checks: checks.map(({ pass, label, fix }) => ({
        pass,
        label,
        fix: fix ?? null,
      })),
    };
    process.stdout.write(JSON.stringify(result, null, 2) + "\n");
    process.exit(result.all_passed ? 0 : 1);
  }

  console.log("\ncareer-ops-cn 健康检查\n" + "─".repeat(40));
  for (const { pass, warn, label, fix } of checks) {
    const icon = pass ? (warn ? "⚠️" : "✓") : "✗";
    const color = pass ? (warn ? yellow : green) : red;
    console.log(`  ${color(icon)}  ${label}`);
    if (!pass && fix) {
      console.log(`      ${dim("→ " + fix)}`);
    }
  }

  const failed = checks.filter((c) => !c.pass);
  const warnings = checks.filter((c) => c.warn);
  console.log("─".repeat(40));
  if (failed.length === 0) {
    console.log(
      `  ${green("全部通过")}${warnings.length ? `（${warnings.length} 个警告）` : ""}\n`,
    );
    process.exit(0);
  } else {
    console.log(`  ${red(`${failed.length} 项未通过`)},请按提示修复后重试。\n`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("健康检查失败:", err);
  process.exit(1);
});
