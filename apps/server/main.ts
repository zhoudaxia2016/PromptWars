/**
 * PromptWars 通用 API 服务 (Deno Deploy)
 * 环境变量: OPENAI_API_KEY | DEEPSEEK_API_KEY | LLM_BASE_URL+LLM_API_KEY
 */
import { corsHeaders, json } from './lib/cors.ts';
import { handleCrosswordClues } from './routes/crossword.ts';

const ROUTES: Record<string, { method: string; handler: (req: Request) => Promise<Response> }> = {
  '/api/crossword/clues': { method: 'POST', handler: handleCrosswordClues },
};

const PORT = parseInt(Deno.env.get('PORT') ?? '8000', 10);
Deno.serve({ port: PORT }, async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const path = new URL(req.url).pathname;

  if (path === '/' && req.method === 'GET') {
    return json({
      service: 'PromptWars API',
      routes: Object.keys(ROUTES).map((p) => ({
        path: p,
        method: ROUTES[p].method,
      })),
    });
  }

  const route = ROUTES[path];
  if (route && req.method === route.method) {
    return route.handler(req);
  }

  return json({ error: 'Not Found' }, 404);
});
