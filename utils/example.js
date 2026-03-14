/**
 * 调用示例：node utils/example.js
 * 需设置环境变量 OPENAI_API_KEY
 */
import { callLLM } from './llm.js';

async function main() {
  const reply = await callLLM({
    prompt: '用一句话介绍日语「こんにちは」',
    model: 'gpt-4o-mini'
  });
  console.log(reply);
}

main().catch(console.error);
