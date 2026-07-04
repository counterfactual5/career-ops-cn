---
name: career-ops-cn
description: "AI 求职助手 — 截图/粘贴 JD 后执行 A-G 完整评估，含简历匹配、薪酬分析、面试备考、职位真实性检测"
metadata: {"openclaw": { "emoji": "🎯", "requires": { "anyBins": ["node"] } }}
---

# career-ops-cn — AI 求职助手 (中国版)

## 触发条件

当用户通过以下任一方式提供职位描述（JD）时，启动 A-G 完整评估流程：

1. **截图/照片** — 用户发来招聘平台（BOSS直聘、拉勾、猎聘、智联等）的截图
2. **粘贴文本** — 用户直接粘贴 JD 文字
3. **URL 链接** — 用户发来职位链接（优先尝试用 `web_fetch` 抓取，抓不到则告知用户需要截图或粘贴）

## 前置读取

每次评估前，按顺序加载以下数据源：

| 步骤 | 路径 | 说明 |
|---|---|---|
| 1 | `read {baseDir}/modes/_shared.md` | 评分系统、画像检测规则、中国市场特别说明 |
| 2 | `read {baseDir}/modes/oferta.md` | A-G 完整评估流程（核心大脑） |
| 3 | `read {baseDir}/config/profile.yml` | 候选人的个人配置（目标岗位、薪资期望等） |
| 4 | `read {baseDir}/cv.md` | 候选人简历（如不存在则提示用户创建） |

> `{baseDir}` 是此 SKILL.md 所在目录（即项目根目录），OpenClaw 会自动解析此占位符。

## 工作流程

### 第 1 步 — 解析输入

- **截图/照片：** 使用 `read` 工具的图片识别能力提取 JD 全文（OpenClaw 内置 `read` 支持视觉）
- **粘贴文本：** 直接使用用户发来的文字
- **URL：** 使用 `web_fetch` 工具抓取页面内容。若返回登录页或空白页，告知用户「该平台需要登录，请截图或粘贴发过来」

### 第 2 步 — A-G 完整评估

遵循 `modes/oferta.md` 中定义的完整流程：

1. **步骤 0 — 岗位画像识别** — 将 JD 归类为 6 种画像之一（AI 平台/LLMOps、Agent/自动化、技术 PM、解决方案架构师、前线交付工程师 FDE、AI 转型专家）
2. **A 岗位概览** — 画像、技术领域、职级、工作模式等
3. **B 简历匹配分析** — JD 要求与 `cv.md` 逐项对比，含差距弥补策略
4. **C 级别判断与策略** — 实际职级匹配度、包装策略、低级别预案
5. **D 薪酬竞争力** — 使用 `web_search` 查市场薪资范围和公司薪酬口碑
6. **E 定制方案** — 简历 Top 5 修改方案
7. **F 面试备考** — 6-10 个 STAR 故事包装 + 防线问答
8. **G 职位真实性** — 使用 `web_search` 查裁员/融资/经营信号，结合 JD 文本分析

**评分标准** 见 `_shared.md`：
- 4.5+ → 极佳匹配
- 4.0-4.4 → 良好匹配
- 3.5-3.9 → 一般匹配
- 3.5 以下 → 不推荐

### 第 3 步 — 保存评估报告

将完整的 A-G 评估结果保存到 `reports/` 目录：

```bash
# 1. 先通过脚本获取下一个报告编号
exec node {baseDir}/scripts/reports/reserve-report-num.mjs
# stdout 返回 3 位编号，如 "035"

# 2. 构造文件名：{编号}-{公司名slug}-{日期}.md
#    公司名 slug：中文转拼音或英文缩写，全小写，空格用连字符

# 3. 用 write 工具写入报告文件

# 4. 释放哨兵
exec node {baseDir}/scripts/reports/reserve-report-num.mjs --release {编号}
```

报告文件内容格式见 `modes/oferta.md` 的「评估后处理流程」章节。

### 第 4 步 — 登记投递追踪

将本次评估结果追加到投递追踪表：

```bash
# 将新记录写入 batch/tracker-additions/ 目录（TSV 格式）
# 格式：{编号}\t{日期}\t{公司名}\t{职位}\t{评分}\tEvaluated\t❌\t[编号](reports/{文件路径})
# 然后运行合并脚本
exec node {baseDir}/scripts/tracker/merge-tracker.mjs
```

### 第 5 步 — 通过 IM 回复用户

评估完成后，使用 `message` 工具分块回复用户：

- **短消息（综合评分 + 一句话结论）** 直接发送
- **长报告（完整 A-G 评估）** 按维度分块发送，避免单条消息过长。推荐分组：
  - 第 1 条：评分 + 岗位概览（A 维度）
  - 第 2 条：简历匹配 + 级别策略（B + C 维度）
  - 第 3 条：薪酬 + 定制方案（D + E 维度）
  - 第 4 条：面试备考 + 真实性检测（F + G 维度）
- 在最后一条消息中注明报告已保存到 `reports/` 目录

## 快捷指令

用户可以通过以下斜杠命令快速触发特定功能：

- `/evaluate` — 评估当前 JD（截图或粘贴）
- `/report` — 查看最新一份评估报告
- `/tracker` — 查看投递追踪表
- `/pdf` — 为当前岗位生成定制 PDF 简历

## 工具映射

| 原始模式中的工具 | OpenClaw 等效工具 |
|---|---|
| `Read`（图片识别） | `read`（OpenClaw 内置图片理解） |
| `WebSearch` | `web_search` |
| URL 抓取 | `web_fetch` |
| 文件写入 | `write` |
| 脚本执行 | `exec` |
| 回复候选人 | `message` |

## 注意事项

1. **不要直接修改 `cv.md` 或 `config/profile.yml`** — 只读取，不写入
2. **不要代表候选人提交投递** — AI 只做评估和生成，投递动作由用户手动完成
3. **中国市场的特别考量** 见 `_shared.md`（五险一金、年终奖、竞业限制、996 等）
4. **IM 消息长度** — 微信/QQ/飞书等 IM 渠道单条消息有长度限制。长报告务必分块发送
5. **如果 `config/profile.yml` 不存在**，请用户从 `config/profile.example.yml` 复制创建
6. **如果 `cv.md` 不存在**，请用户提供简历信息

## 安装方式

```bash
# 从 GitHub 安装
openclaw skills install git:counterfactual5/career-ops-cn

# 从本地目录安装
openclaw skills install /path/to/career-ops-cn
```
