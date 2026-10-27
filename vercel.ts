import type { VercelConfig } from "@vercel/config/v1";

export const config: VercelConfig = {
  // 서버 함수를 Neon DB(싱가포르)와 같은 리전에 둔다 — 쿼리마다 바다를 건너지 않게.
  regions: ["sin1"],
};
