# ctx Web

[![Cloudflare Pages](https://img.shields.io/badge/%E9%83%A8%E7%BD%B2-Cloudflare%20Pages-F38020?logo=cloudflare&logoColor=white)](https://pages.cloudflare.com/)
[![Hono](https://img.shields.io/badge/%E6%A1%86%E6%9E%B6-Hono-E36002?logo=hono&logoColor=white)](https://hono.dev/)
[![Tailwind CSS](https://img.shields.io/badge/%E6%A0%B7%E5%BC%8F-Tailwind%20CSS%204-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![TypeScript](https://img.shields.io/badge/%E8%AF%AD%E8%A8%80-TypeScript-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/%E6%9E%84%E5%BB%BA-Vite-646CFF?logo=vite&logoColor=white)](https://vite.dev/)
[![MIT License](https://img.shields.io/badge/%E5%8D%8F%E8%AE%AE-MIT-22C55E)](./LICENSE)

[getctx.org](https://getctx.org) 的服务端渲染网站，基于 Hono SSR 和 Lyra 设计系统（锐利几何、零圆角）构建。

**[English](./README.md)**

## 快速开始

```bash
pnpm install
pnpm dev
```

## 命令

| 命令             | 说明                           |
| ---------------- | ------------------------------ |
| `pnpm dev`       | 启动 Vite 开发服务器           |
| `pnpm build`     | 生产环境构建                   |
| `pnpm preview`   | 使用 Wrangler Pages 本地预览   |
| `pnpm deploy`    | 构建并部署到 Cloudflare Pages  |
| `pnpm test`      | 使用 Vitest 运行测试           |
| `pnpm typecheck` | TypeScript 类型检查            |

## 架构

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

## 技术栈

- **运行时** — [Cloudflare Pages](https://pages.cloudflare.com/)（Workers）
- **框架** — [Hono](https://hono.dev/)（SSR + JSX）
- **样式** — [Tailwind CSS 4](https://tailwindcss.com/) + Lyra 设计令牌
- **构建** — [Vite](https://vite.dev/)
- **测试** — [Vitest](https://vitest.dev/)

## 环境变量

| 变量                   | 说明               | 必填 |
| ---------------------- | ------------------ | ---- |
| `API_BASE_URL`         | 后端 API 地址      | 是   |
| `GITHUB_CLIENT_ID`     | GitHub OAuth 应用 ID | 否 |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth Secret  | 否 |
