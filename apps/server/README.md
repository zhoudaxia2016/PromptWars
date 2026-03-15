# PromptWars API 服务 (Deno Deploy)

通用后端 API，供 web 及各模块调用。

## 本地开发

1. 复制 `.env.example` 为 `.env`，填写 `OPENAI_API_KEY`、`DEEPSEEK_API_KEY` 或 `LLM_BASE_URL`+`LLM_API_KEY`
2. 运行：

```bash
cd apps/server
deno task dev
```

默认端口 8000，Vite 会代理 `/api` 到此处。同时运行 `npm run dev` 启动前端。

## 部署

1. 在 [Deno Deploy](https://deno.com/deploy) 创建项目
2. 入口文件：`apps/server/main.ts`
3. 环境变量：
   - `OPENAI_API_KEY` → 自动使用 api.openai.com
   - `DEEPSEEK_API_KEY` → 自动使用 api.deepseek.com
   - 其他模型：`LLM_BASE_URL` + `LLM_API_KEY`
   - `LLM_MODEL`（可选）：OpenAI 默认 gpt-4o-mini，DeepSeek 默认 deepseek-chat

## 接口

| 路径 | 方法 | 说明 |
|------|------|------|
| `/` | GET | 服务信息与路由列表 |
| `/api/crossword/clues` | POST | 填字游戏：生成日文提示 |

### POST /api/crossword/clues

- **Body**: `{ "words": [{ "r": "konnichiwa", "k": "こんにちは" }, ...] }`
- **Response**: `{ "pairs": [...], "clues": ["...", ...] }`
