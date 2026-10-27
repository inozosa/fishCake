export function jsonError(message: string, status = 400) {
  return Response.json({ error: message }, { status });
}

export async function readJson(req: Request): Promise<Record<string, unknown> | null> {
  // 다른 사이트의 <form>(text/plain 등)으로는 보낼 수 없는 형식만 받는다 — 로그인 CSRF 방지
  if (!req.headers.get("content-type")?.includes("application/json")) return null;
  try {
    const body = await req.json();
    return body && typeof body === "object" && !Array.isArray(body) ? body : null;
  } catch {
    return null;
  }
}

export function cleanText(value: unknown, maxLength: number): string {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

export function toInt(value: unknown, min: number, max: number): number | null {
  const n = typeof value === "number" ? value : typeof value === "string" && value.trim() ? Number(value) : NaN;
  return Number.isInteger(n) && n >= min && n <= max ? n : null;
}

/** URL 경로의 [id] 값. 숫자가 아니면 null */
export const toId = (value: string) => toInt(value, 1, 2_147_483_647);

export const MAX_PRICE = 1_000_000;
export const MAX_STOCK = 9999;
