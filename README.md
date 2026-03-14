# PromptWars

React + TypeScript 多 workspace 项目。

## 项目结构

```
promptwars/
├── apps/
│   └── web/          # 主应用 (Vite + React + React Router)
├── packages/
│   ├── shared/       # 共享工具 (callLLM 等)
│   ├── cubic/        # 3D 魔方逻辑
│   └── crossword/    # 日语填字逻辑
├── package.json
└── pnpm-workspace.yaml
```

## 开发

```bash
npm install
npm run dev
```

访问 http://localhost:5173

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

### crossword · 日语填字游戏

- 横向 / 纵向日语单词
- 罗马音输入，平假名显示
- 点击提示可定位到对应格子

### shared · 共享工具

- `callLLM`：OpenAI 兼容 API 调用

## GitHub Pages 部署

推送 `main` 分支后，GitHub Actions 会自动构建并部署。

**首次使用：** 在仓库 Settings → Pages → Build and deployment → Source 选择 **GitHub Actions**。

**访问地址：** `https://<用户名>.github.io/PromptWars/`
