export interface ApiResponse<T = any> {
  status: number;
  body: T;
}

/** Appel JSON renvoyant toujours le couple { status, body } sans lever d'exception. */
export async function call<T = any>(
  baseUrl: string,
  path: string,
  init: RequestInit = {},
): Promise<ApiResponse<T>> {
  const res = await fetch(`${baseUrl}${path}`, init);
  let body: any = null;
  const text = await res.text();
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
  }
  return { status: res.status, body: body as T };
}

export function jsonPost(baseUrl: string, path: string, body: unknown, headers: Record<string, string> = {}) {
  return call(baseUrl, path, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
}

export function jsonPatch(baseUrl: string, path: string, body: unknown, headers: Record<string, string> = {}) {
  return call(baseUrl, path, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
}
