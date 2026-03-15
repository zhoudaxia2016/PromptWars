/**
 * 通用 API 请求客户端，供各模块调用 apps/server
 * 开发环境：Vite 代理 /api 到本地 Deno，使用相对路径
 * 正式环境：使用 VITE_API_URL
 */

const isDev = import.meta.env.DEV;
const BASE_URL = (import.meta.env.VITE_API_URL as string)?.trim();

export function isApiConfigured(): boolean {
  return isDev || !!BASE_URL;
}

function getUrl(path: string): string {
  const base = isDev ? '' : (BASE_URL?.replace(/\/$/, '') ?? '');
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${base}${p}`;
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let err: string;
    try {
      const data = await res.json();
      err = (data as { error?: string })?.error ?? res.statusText;
    } catch {
      err = (await res.text()) || res.statusText;
    }
    throw new Error(err);
  }
  return res.json() as Promise<T>;
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(getUrl(path), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return handleResponse<T>(res);
}

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(getUrl(path));
  return handleResponse<T>(res);
}
