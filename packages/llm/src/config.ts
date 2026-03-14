/**
 * 大模型配置，在 initLLMConfig 内读取 packages/llm/src/config.json
 * apiKey 可用 ${VITE_XXX} 引用 .env 中的变量
 */

import defaultConfig from './config.json';

export interface LLMProvider {
  baseUrl: string;
  apiKey: string;
  model: string;
  name: string;
}

export interface ConfigProvider {
  baseUrl: string;
  name: string;
  apiKey: string;
  model?: string;
}

let configCache: ConfigProvider[] | null = undefined as unknown as ConfigProvider[] | null;

function getEnv(key: string): string {
  const env = (import.meta as { env?: Record<string, unknown> }).env;
  return (env?.[key] as string)?.trim() ?? '';
}

function resolveEnvRef(val: string): string {
  const m = val.match(/^\$\{(.+)\}$/);
  return m ? getEnv(m[1]) : val;
}

function toLLMProvider(p: ConfigProvider): LLMProvider | null {
  const apiKey = resolveEnvRef(p.apiKey).trim();
  if (!apiKey) return null;
  const baseUrl = (p.baseUrl ?? '').replace(/\/$/, '');
  if (!baseUrl) return null;
  return {
    baseUrl,
    apiKey,
    model: p.model || 'gpt-4o-mini',
    name: p.name,
  };
}

/** 初始化配置：无参时读取 packages/llm/src/config.json */
export function initLLMConfig(initialConfig?: ConfigProvider[] | null): void {
  if (configCache !== undefined) return;
  if (initialConfig !== undefined) {
    configCache = Array.isArray(initialConfig) ? initialConfig : null;
    return;
  }
  configCache = Array.isArray(defaultConfig) ? defaultConfig : null;
}

/** 获取配置 */
export function getLLMConfig(): { provider: LLMProvider | null; customProviders: LLMProvider[] } {
  if (configCache === undefined || configCache === null) {
    return { provider: null, customProviders: [] };
  }
  const providers = configCache.map(toLLMProvider).filter((p): p is LLMProvider => p !== null);
  return { provider: providers[0] ?? null, customProviders: providers };
}

/** 获取默认 provider，供 callLLM 使用 */
export function getDefaultProvider(): LLMProvider | null {
  return getLLMConfig().provider;
}
