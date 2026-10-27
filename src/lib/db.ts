import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

export type Sql = NeonQueryFunction<false, false>;

let client: Sql | undefined;

/** Neon 쿼리 함수. 테이블은 `npm run db:setup`(빌드 때 자동 실행)으로 만든다. */
export function getSql(): Sql {
  if (!client) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL이 없어요. .env.local에 Neon 연결 문자열을 넣어 주세요.");
    client = neon(url);
  }
  return client;
}

export function isUniqueViolation(e: unknown): boolean {
  return typeof e === "object" && e !== null && (e as { code?: unknown }).code === "23505";
}
