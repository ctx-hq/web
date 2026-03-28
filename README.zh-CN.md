# ctx — LLM 上下文的通用包管理器

[![Cloudflare Pages](https://img.shields.io/badge/%E9%83%A8%E7%BD%B2-Cloudflare%20Pages-F38020?logo=cloudflare&logoColor=white)](https://pages.cloudflare.com/)
[![Hono](https://img.shields.io/badge/%E6%A1%86%E6%9E%B6-Hono-E36002?logo=hono&logoColor=white)](https://hono.dev/)
[![Tailwind CSS](https://img.shields.io/badge/%E6%A0%B7%E5%BC%8F-Tailwind%20CSS%204-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![TypeScript](https://img.shields.io/badge/%E8%AF%AD%E8%A8%80-TypeScript-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![MIT License](https://img.shields.io/badge/%E5%8D%8F%E8%AE%AE-MIT-22C55E)](./LICENSE)

**[English](./README.md)**

发现、安装和管理 AI Agent 的 **Skills**、**MCP 服务器**和 **CLI 工具** — 统一的包注册中心。

ctx 让你的 AI Agent 在正确的时机获得正确的上下文。你可以把它理解为 LLM 工具链的 npm：一条命令搜索、安装、运行扩展 Agent 能力的包。

## 快速开始

**AI Agent 使用** — 粘贴以下内容到你的 Agent（Claude、Cursor 等）：

```
Read https://getctx.org/skill.md and follow the instructions to use ctx
```

**手动安装** — 安装 CLI：

```bash
# macOS / Linux
curl -fsSL https://getctx.org/install.sh | sh

# Windows
irm https://getctx.org/install.ps1 | iex
```

然后使用：

```bash
ctx search "code review"    # 搜索包
ctx install @scope/name     # 安装包
ctx serve                   # 启动 MCP 服务器
```

## 可以安装什么？

| 类型    | 说明                               | 示例                         |
| ------- | ---------------------------------- | ---------------------------- |
| `skill` | AI Agent 可复用的提示词和工作流    | 代码审查、提交规范           |
| `mcp`   | 为 Agent 提供工具能力的 MCP 服务器 | 数据库查询、API 连接器       |
| `cli`   | 开发者工作流的命令行工具           | 代码检查、格式化、脚手架     |

浏览所有包：[getctx.org/search](https://getctx.org/search)

---

## 开发

本仓库是 [getctx.org](https://getctx.org) 网站 — 基于 Hono SSR 和 Lyra 设计系统（锐利几何、零圆角）构建。

### 快速开始

```bash
pnpm install
pnpm dev
```

### 命令

| 命令             | 说明                           |
| ---------------- | ------------------------------ |
| `pnpm dev`       | 启动 Vite 开发服务器           |
| `pnpm build`     | 生产环境构建                   |
| `pnpm preview`   | 使用 Wrangler Pages 本地预览   |
| `pnpm deploy`    | 构建并部署到 Cloudflare Pages  |
| `pnpm test`      | 使用 Vitest 运行测试           |
| `pnpm typecheck` | TypeScript 类型检查            |

### 架构

```
src/
├── index.tsx          # Hono 应用及全部路由
├── layout.tsx         # HTML 外壳，含 SEO meta
├── components/        # 服务端渲染的 Hono JSX 组件
├── pages/             # 页面组件
├── lib/               # API 客户端、SEO 工具、类型、常量
└── styles/
    └── globals.css    # Lyra 设计令牌 + Tailwind 4
```

所有数据通过 HTTP 从 API 层获取（`API_BASE_URL` 环境变量，必填）。

### 技术栈

- **运行时** — [Cloudflare Pages](https://pages.cloudflare.com/)（Workers）
- **框架** — [Hono](https://hono.dev/)（SSR + JSX）
- **样式** — [Tailwind CSS 4](https://tailwindcss.com/) + Lyra 设计令牌
- **构建** — [Vite](https://vite.dev/)
- **测试** — [Vitest](https://vitest.dev/)

### 环境变量

| 变量                   | 说明               | 必填 |
| ---------------------- | ------------------ | ---- |
| `API_BASE_URL`         | 后端 API 地址      | 是   |
| `GITHUB_CLIENT_ID`     | GitHub OAuth 应用 ID | 否 |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth Secret  | 否 |
