# PromptWars

React + TypeScript 多 workspace 项目。

## 项目结构

```
promptwars/
├── apps/
│   ├── web/          # 主应用 (Vite + React + React Router)
│   └── server/       # 通用 API 服务 (Deno Deploy)
├── packages/
│   └── cubic/        # 3D 魔方逻辑
├── package.json
└── package.json
```

## 开发

```bash
npm install
# 终端 1：启动 API 服务（填字等需调用）
cd apps/server && deno task dev
# 终端 2：启动前端
npm run dev
```

访问 http://localhost:5173。Vite 会代理 `/api` 到本地 Deno (localhost:8000)。

## 构建

```bash
npm run build
```

输出到 `apps/web/dist/`

## 模块

### cubic · 3D 魔方

- 3D 魔方交互（鼠标拖拽视角、滚轮缩放）
- WCA 打乱公式生成
- 贴纸状态展示、复制 54 字符
- 复制 AI 还原提示词
- CFOP 公式库（OLL / PLL / F2L）

### crossword · 日语填字游戏（apps/web/src/pages/crossword）

- 横向 / 纵向日语单词
- 罗马音输入，平假名显示
- 点击提示可定位到对应格子
- **提示生成**：开发时 Vite 代理到本地 Deno，正式环境需配置 `VITE_API_URL`

## GitHub Pages 部署

推送 `main` 分支后，GitHub Actions 会自动构建并部署。

**首次使用：**
1. 仓库 Settings → Pages → Build and deployment → Source 选择 **GitHub Actions**
2. Settings → Secrets and variables → Actions 添加 `VITE_API_URL`（你的 Deno Deploy 地址，如 `https://xxx.deno.dev`）

**访问地址：** `https://<用户名>.github.io/PromptWars/`
