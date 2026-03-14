/**
 * 大模型调用工具
 * 支持 OpenAI 兼容 API
 */

export interface CallLLMOptions {
  prompt: string;
  system?: string;
  apiKey?: string;
  baseUrl?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

/**
 * 调用大模型
 */
export async function callLLM({
  prompt,
  system,
  apiKey = '',
  baseUrl = 'https://api.openai.com/v1',
  model = 'gpt-4o-mini',
  temperature = 0.7,
  maxTokens = 2048,
}: CallLLMOptions): Promise<string> {
  if (!apiKey) {
    throw new Error('请传入 apiKey 参数（或在使用处从 process.env.OPENAI_API_KEY 读取）');
  }

  const messages: { role: string; content: string }[] = [];
  if (system) {
    messages.push({ role: 'system', content: system });
  }
  messages.push({ role: 'user', content: prompt });

  const url = `${baseUrl.replace(/\/$/, '')}/chat/completions`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`API 请求失败 (${res.status}): ${err}`);
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = data.choices?.[0]?.message?.content;
  if (content == null) {
    throw new Error('API 返回格式异常');
  }
  return content.trim();
}
