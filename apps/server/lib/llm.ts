async function callLLMInternal(
  apiKey: string,
  baseUrl: string,
  model: string,
  system: string,
  prompt: string,
  options?: { temperature?: number; maxTokens?: number }
): Promise<string> {
  const url = baseUrl.replace(/\/$/, '') + '/chat/completions';
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: prompt },
      ],
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 2048,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`LLM API 失败 (${res.status}): ${err}`);
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = data.choices?.[0]?.message?.content;
  if (content == null) throw new Error('LLM 返回格式异常');
  return content.trim();
}

const OPENAI_BASE = 'https://api.openai.com/v1';
const DEEPSEEK_BASE = 'https://api.deepseek.com/v1';

function getLLMEnv() {
  const deepseekKey = Deno.env.get('DEEPSEEK_API_KEY');
  const openaiKey = Deno.env.get('OPENAI_API_KEY');
  const customBase = Deno.env.get('LLM_BASE_URL');
  const customKey = Deno.env.get('LLM_API_KEY');

  if (deepseekKey?.trim()) {
    return { apiKey: deepseekKey, baseUrl: DEEPSEEK_BASE, model: Deno.env.get('LLM_MODEL') ?? 'deepseek-chat' };
  }
  if (openaiKey?.trim()) {
    return { apiKey: openaiKey, baseUrl: OPENAI_BASE, model: Deno.env.get('LLM_MODEL') ?? 'gpt-4o-mini' };
  }
  if (customBase?.trim() && customKey?.trim()) {
    return { apiKey: customKey, baseUrl: customBase.replace(/\/$/, ''), model: Deno.env.get('LLM_MODEL') ?? 'gpt-4o-mini' };
  }
  return { apiKey: '', baseUrl: '', model: '' };
}

export async function callLLM(
  system: string,
  prompt: string,
  options?: { temperature?: number; maxTokens?: number }
): Promise<string> {
  const { apiKey, baseUrl, model } = getLLMEnv();
  if (!apiKey?.trim()) {
    throw new Error('未配置 LLM：设置 OPENAI_API_KEY、DEEPSEEK_API_KEY 或 LLM_API_KEY+LLM_BASE_URL');
  }
  return callLLMInternal(apiKey, baseUrl, model, system, prompt, options);
}
