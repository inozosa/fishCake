import type { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { getSql } from "@/lib/db";
import { MAX_STOCK, jsonError, readJson, toId } from "@/lib/http";
import { parseMenuInput } from "@/lib/inputs";
import { findStoreById } from "@/lib/stores";

type Ctx = RouteContext<"/api/owner/menus/[id]">;

const NOT_FOUND = "메뉴를 찾을 수 없어요.";

// 내 가게의 메뉴인지는 쿼리 안에서 확인한다 (store_id = 내 가게). 결과가 없으면 남의 메뉴이거나 없는 메뉴.

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const guard = await requireUser("owner");
  if (!guard.ok) return guard.response;
  const menuId = toId((await ctx.params).id);
  if (!menuId) return jsonError(NOT_FOUND, 404);

  const body = await readJson(req);
  if (!body) return jsonError("잘못된 요청이에요.");
  const parsed = parseMenuInput(body, true);
  if (!parsed.ok) return jsonError(parsed.error);

  // delta(+1/-1 버튼)는 DB에서 원자적으로 더해서 여러 번 빠르게 눌러도 꼬이지 않게 한다.
  const f = parsed.fields;
  const [updated] = (await getSql()`
    WITH m AS (
      UPDATE menus SET
        name  = COALESCE(${f.name ?? null}::text, name),
        price = COALESCE(${f.price ?? null}::int, price),
        stock = GREATEST(0, LEAST(${MAX_STOCK}::int, COALESCE(${f.stock ?? null}::int, stock) + ${f.delta ?? 0}::int))
      WHERE id = ${menuId} AND store_id = (SELECT id FROM stores WHERE owner_id = ${guard.value.id})
      RETURNING store_id
    )
    UPDATE stores SET updated_at = now() WHERE id IN (SELECT store_id FROM m) RETURNING id`) as { id: number }[];
  if (!updated) return jsonError(NOT_FOUND, 404);

  return Response.json({ store: await findStoreById(updated.id) });
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const guard = await requireUser("owner");
  if (!guard.ok) return guard.response;
  const menuId = toId((await ctx.params).id);
  if (!menuId) return jsonError(NOT_FOUND, 404);

  const [updated] = (await getSql()`
    WITH d AS (
      DELETE FROM menus
      WHERE id = ${menuId} AND store_id = (SELECT id FROM stores WHERE owner_id = ${guard.value.id})
      RETURNING store_id
    )
    UPDATE stores SET updated_at = now() WHERE id IN (SELECT store_id FROM d) RETURNING id`) as { id: number }[];
  if (!updated) return jsonError(NOT_FOUND, 404);

  return Response.json({ store: await findStoreById(updated.id) });
}
