# 🎯 Career-Ops CN — AI 求职助手（中国版）

> 基于 [career-ops](https://github.com/santifer/career-ops) (MIT) 改制，面向中国国内市场的 AI 求职系统。  
> 截图发 JD → AI 评估匹配度 → 定制简历 → 面试备考，一条龙辅助。

## 这是什么？

Career-Ops CN 是一个 AI 驱动的求职辅助系统，专门针对**中国国内市场**设计。它帮你：

1. **评估 JD** — 发截图或粘贴职位描述，AI 深度分析匹配度、薪酬竞争力、职位真实性
2. **定制简历** — 根据 JD 自动调整简历重点，生成针对性的 PDF
3. **备考面试** — 从你的项目经历中提取 STAR 故事，包装成面试话术
4. **追踪投递** — 对所有评估过的职位进行追踪管理

## 为什么不做 URL 爬取？

国内招聘平台（BOSS直聘、拉勾、猎聘、智联）反爬阻力大，全部需要登录查看完整 JD。  
这个项目坚持**人肉投喂**思路——你在任何平台看到感兴趣的岗位，截图发过来就行，我负责消化分析。

## 快速开始

### 方式 1：Agent 对话（推荐，零配置）

使用任何 AI 编码 CLI（Claude Code、Codex、Gemini CLI、OpenCode 等），在项目根目录启动：

```bash
# Claude Code
claude -p "帮我分析这个 JD" /path/to/jd-screenshot.png

# 或直接进入交互模式
claude
```

然后直接把 JD 截图发过来或粘贴文字即可。

### 方式 2：Web UI（本地可视化）

```bash
cd web
npm ci
npm run dev
```

打开 http://localhost:3000 ，在浏览器中管理你的求职流程。

### 方式 3：PDF 生成与工具脚本

```bash
cd career-ops-cn
npm install   # 安装依赖
node doctor.mjs   # 检查项目健康状态
node generate-pdf.mjs   # 生成简历 PDF
```

## 功能特性

- ✅ **截图/照片输入** — 用手机拍屏幕或截屏发过来，AI 提取全文
- ✅ **A-G 全面评估** — 14 个画像检测、6 维评分体系 + 职位真实性评估
- ✅ **中国市场适配** — 五险一金、年终奖、竞业限制、996、落户政策等本土概念
- ✅ **简历定制** — 根据 JD 自动调整简历重点，一键生成 PDF
- ✅ **面试备考** — STAR+R 故事库管理与面试话术包装
- ✅ **投递追踪** — 所有评估记录自动归档管理
- ✅ **Web 可视面板** — Next.js 本地实时仪表盘
- ✅ **本地优先** — 所有数据存在你的机器上，不外传

## 项目结构

```
career-ops-cn/
├── SKILL.md                # 🤖 OpenClaw 专用入口（IM 渠道）
├── AGENTS.md               # 📝 Claude Code / Codex 等通用入口
├── modes/                  # 🧠 AI 评估 prompt 体系（核心）
│   ├── _shared.md          #   共享规则、评分系统
│   ├── oferta.md           #   A-G 完整评估流程
│   ├── apply.md            #   申请表单助手
│   └── pipeline.md         #   批量处理流程
├── web/                    # 🌐 Next.js 前端
├── scripts/                # 🛠️ 核心工具脚本
├── config/                 # ⚙️ 个人配置
│   ├── profile.example.yml #   个人资料模板
│   └── plugins.example.yml #   插件配置
├── templates/              # 📄 简历 PDF 模板
├── fonts/                  # 🔤 PDF 字体
├── data/                   # 📊 追踪数据
└── reports/                # 📋 评估报告存档
```

## 评估维度的含义

| 分数 | 含义 | 建议 |
|---|---|---|
| 4.5+ | 极佳匹配 | 立即投递 |
| 4.0-4.4 | 良好匹配 | 值得投递 |
| 3.5-3.9 | 一般匹配 | 有特殊理由再考虑 |
| 3.5 以下 | 匹配度低 | 不建议投递 |

## 感谢

基于 [santifer/career-ops](https://github.com/santifer/career-ops) (MIT License) 改制。  
中文模式翻译由 [SparshGarg999](https://github.com/SparshGarg999) 贡献至原项目。

## License

MIT — 和原项目保持一致。
