# 模板

career-ops-cn 脚本和模式使用的系统层模板文件。

## 文件

| 文件 | 使用者 | 用途 |
|------|---------|---------|
| `cv-template.html` | `generate-pdf.mjs` | ATS 优化简历 PDF 的 HTML/CSS 模板 |
| `resume-template.html` | `generate-pdf.mjs`（通过 `--template`） | `cv-template.html` 的简历变体。布局和占位符相同；差异：`<title>` 显示"Resume"而非"CV"，无证书部分，针对 1–2 页美国/行业格式 |
| `cv-template.tex` | `generate-latex.mjs` | Overleaf 兼容的 ATS 优化简历 PDF 的 LaTeX 模板 |
| `portals.example.yml` | 参考 | 示例门户配置（本项目不依赖扫描，仅作参考） |
| `states.yml` | `verify-pipeline.mjs`、`merge-tracker.mjs`、`tracker.mjs` | 规范申请状态及其别名 |

### cv-template.html

由 Playwright 渲染为 PDF 的 HTML 模板。使用占位符（`{{NAME}}`、`{{SUMMARY_TEXT}}`、`{{EXPERIENCE}}` 等），在生成时由 PDF 管线填充。

**设计：** Space Grotesk 标题 + DM Sans 正文，单栏 ATS 安全布局，`fonts/` 自托管字体。

**自定义：** 编辑此文件以更改颜色、间距或章节顺序。占位符 token 列表见脚本源码 `scripts/generate-pdf.mjs`。

### resume-template.html

`cv-template.html` 的简历变体，用于美国/行业求职申请。与 CV 模板的关键差异：

- **标题**显示"Resume"而非"CV"
- **无证书部分** — 简历聚焦最近、相关经验
- **设计为 1–2 页** — 略去学术风格章节

使用相同的占位符（`{{NAME}}`、`{{SUMMARY_TEXT}}` 等），完全兼容现有 PDF 管线。

**保持同步：** 更新 `cv-template.html` 时，对 `resume-template.html` 应用匹配更改（保留上述差异）。

### cv-template.tex

Overleaf 兼容的简历生成 LaTeX 模板。基于 [sb2nov/resume](https://github.com/sb2nov/resume) 格式。使用占位符（`{{NAME}}`、`{{EXPERIENCE}}`、`{{PROJECTS}}` 等），在生成时由 LaTeX 管线填充。

**设计：** 使用标准 CTAN 包（`fontawesome5`、`enumitem`、`hyperref`、`titlesec`）的单栏 ATS 安全布局。无自定义字体或外部依赖 — 直接上传到 Overleaf。

**用法：**
```bash
# 验证并编译 .tex → .pdf（需要 PATH 上有 pdflatex）
node scripts/generate-latex.mjs output/cv-name-company-date.tex

# 或指定自定义输出路径
node scripts/generate-latex.mjs output/cv-name-company-date.tex output/custom-name.pdf
```

**前置条件：** `pdflatex` 通过 [MiKTeX](https://miktex.org/)（Windows）或 TeX Live（Linux/macOS）。首次编译可能自动安装缺失的 LaTeX 包。或直接上传 `.tex` 文件到 [Overleaf](https://www.overleaf.com) — 无需本地安装。

**自定义：** 编辑此文件以更改边距、章节顺序或格式命令。

### portals.example.yml

> ⚠️ **注意：** career-ops-cn **不依赖扫描功能**。此文件仅作参考保留，实际不会被执行。

原项目的预配置门户扫描器，包含 45+ 追踪公司和搜索查询。

### states.yml

定义 8 个规范申请状态（`Evaluated`、`Applied`、`Responded`、`Interview`、`Offer`、`Rejected`、`Discarded`、`SKIP`）及其常见变体别名。所有管线脚本基于此文件验证状态。

**不要重命名 label 字段** — 仪表盘和所有脚本依赖这些精确字符串做匹配。`aliases` 列表里的中文别名仅用于解析用户输入时做容错匹配，正式写入 applications.md 时始终使用英文 label。
