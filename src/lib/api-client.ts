export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

/** JSON API 호출 헬퍼. 실패하면 서버가 준 한국어 에러 메시지로 ApiError를 던진다. */
export async function api<T>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  const hasBody = init.body !== undefined;
  const res = await fetch(path, {
    method: init.method ?? "GET",
    headers: hasBody ? { "Content-Type": "application/json" } : undefined,
    body: hasBody ? JSON.stringify(init.body) : undefined,
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(data.error ?? "요청을 처리하지 못했어요.", res.status);
  return data as T;
}

export const errorMessage = (e: unknown) => (e instanceof Error ? e.message : "알 수 없는 오류가 발생했어요.");
