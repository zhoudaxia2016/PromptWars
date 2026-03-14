/**
 * 大模型调用，支持 OpenAI 兼容 API
 */

import { getChatUrl } from './providerEndpoints';
import { getLLMConfig } from './config';
import type { LLMProvider } from './config';

export interface CallOptions {
  prompt: string;
  system?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

/**
 * 按配置中的 name 指定大模型并调用，直接传入 name 与参数即可
 */
export async function call(name: string, params: CallOptions): Promise<string> {
  const { provider: defaultProvider, customProviders } = getLLMConfig();
  const all = customProviders.length > 0 ? customProviders : (defaultProvider ? [defaultProvider] : []);
  const provider = all.find((p) => p.name === name);
  if (!provider) throw new Error(`未找到名为「${name}」的模型，请检查 config.json`);
  return callLLM({ ...params, provider });
}

export interface CallLLMOptions extends CallOptions {
  provider?: LLMProvider;
}

export async function callLLM(opts: CallLLMOptions): Promise<string> {
  const provider = opts.provider;
  if (!provider) throw new Error('请传入 provider');
  const apiKey = provider.apiKey.trim();
  if (!apiKey) throw new Error('请配置 apiKey');
  const model = opts.model ?? provider.model ?? 'gpt-4o-mini';

  const chatUrl = getChatUrl(provider);
  if (!chatUrl) throw new Error('无法解析补全接口 URL，请配置 baseUrl');

  const messages: { role: string; content: string }[] = [];
  if (opts.system) {
    messages.push({ role: 'system', content: opts.system });
  }
  messages.push({ role: 'user', content: opts.prompt });

  const res = await fetch(chatUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: opts.temperature ?? 0.7,
      max_tokens: opts.maxTokens ?? 2048,
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
