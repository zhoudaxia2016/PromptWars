/**
 * 大模型调用工具
 * 支持 OpenAI 兼容 API
 */

/**
 * 调用大模型
 * @param {Object} options
 * @param {string} options.prompt - 用户提示词
 * @param {string} [options.system] - 系统提示（可选）
 * @param {string} [options.apiKey] - API Key，默认从 process.env.OPENAI_API_KEY 读取
 * @param {string} [options.baseUrl] - API 地址，默认 https://api.openai.com/v1
 * @param {string} [options.model] - 模型名，默认 gpt-4o-mini
 * @param {number} [options.temperature] - 温度 0-2，默认 0.7
 * @param {number} [options.maxTokens] - 最大输出 token，默认 2048
 * @returns {Promise<string>} 模型回复文本
 */
export async function callLLM({
  prompt,
  system,
  apiKey = process.env.OPENAI_API_KEY,
  baseUrl = 'https://api.openai.com/v1',
  model = 'gpt-4o-mini',
  temperature = 0.7,
  maxTokens = 2048
}) {
  if (!apiKey) {
    throw new Error('请设置 OPENAI_API_KEY 环境变量或传入 apiKey 参数');
  }

  const messages = [];
  if (system) {
    messages.push({ role: 'system', content: system });
  }
  messages.push({ role: 'user', content: prompt });

  const url = `${baseUrl.replace(/\/$/, '')}/chat/completions`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens: maxTokens
    })
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`API 请求失败 (${res.status}): ${err}`);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;
  if (content == null) {
    throw new Error('API 返回格式异常');
  }
  return content.trim();
}
