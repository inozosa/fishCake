import type { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { getSql } from "@/lib/db";
import { jsonError, toId } from "@/lib/http";

type Ctx = RouteContext<"/api/favorites/[storeId]">;

const NOT_FOUND = "가게를 찾을 수 없어요.";

export async function POST(_req: NextRequest, ctx: Ctx) {
  const guard = await requireUser("customer");
  if (!guard.ok) return guard.response;
  const storeId = toId((await ctx.params).storeId);
  if (!storeId) return jsonError(NOT_FOUND, 404);

  // 이미 단골이어도 행을 돌려받도록 DO UPDATE(값은 그대로) — 결과가 없으면 없는 가게
  const rows = await getSql()`
    INSERT INTO favorites (user_id, store_id)
    SELECT ${guard.value.id}, id FROM stores WHERE id = ${storeId}
    ON CONFLICT (user_id, store_id) DO UPDATE SET created_at = favorites.created_at
    RETURNING store_id`;
  if (rows.length === 0) return jsonError(NOT_FOUND, 404);
  return Response.json({ isFavorite: true });
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const guard = await requireUser("customer");
  if (!guard.ok) return guard.response;
  const storeId = toId((await ctx.params).storeId);
  if (!storeId) return jsonError(NOT_FOUND, 404);

  await getSql()`DELETE FROM favorites WHERE user_id = ${guard.value.id} AND store_id = ${storeId}`;
  return Response.json({ isFavorite: false });
}
