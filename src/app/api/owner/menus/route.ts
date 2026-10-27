import { requireOwnerStore } from "@/lib/auth";
import { getSql } from "@/lib/db";
import { jsonError, readJson } from "@/lib/http";
import { parseMenuInput } from "@/lib/inputs";
import { findStoreById } from "@/lib/stores";

const MAX_MENUS = 30;

export async function POST(req: Request) {
  const guard = await requireOwnerStore();
  if (!guard.ok) return guard.response;
  const store = guard.value;

  const body = await readJson(req);
  if (!body) return jsonError("잘못된 요청이에요.");
  const parsed = parseMenuInput(body, false);
  if (!parsed.ok) return jsonError(parsed.error);
  if (store.menus.length >= MAX_MENUS) return jsonError(`메뉴는 최대 ${MAX_MENUS}개까지 등록할 수 있어요.`);

  const { name, price, stock = 0 } = parsed.fields;
  const sql = getSql();
  await sql`
    WITH m AS (
      INSERT INTO menus (store_id, name, price, stock, sort_order)
      VALUES (${store.id}, ${name}, ${price}, ${stock},
              (SELECT COALESCE(MAX(sort_order), -1) + 1 FROM menus WHERE store_id = ${store.id}))
      RETURNING store_id
    )
    UPDATE stores SET updated_at = now() WHERE id IN (SELECT store_id FROM m)`;

  return Response.json({ store: await findStoreById(store.id) }, { status: 201 });
}
