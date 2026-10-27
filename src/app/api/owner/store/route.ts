import { requireOwnerStore, requireUser } from "@/lib/auth";
import { getSql } from "@/lib/db";
import { jsonError, readJson } from "@/lib/http";
import { parseStoreInput } from "@/lib/inputs";
import { findStoreById } from "@/lib/stores";

export async function GET() {
  const guard = await requireOwnerStore();
  if (!guard.ok) return guard.response;
  return Response.json({ store: guard.value });
}

export async function PATCH(req: Request) {
  const guard = await requireUser("owner");
  if (!guard.ok) return guard.response;

  const body = await readJson(req);
  if (!body) return jsonError("잘못된 요청이에요.");
  const parsed = parseStoreInput(body, true);
  if (!parsed.ok) return jsonError(parsed.error);

  // 보내지 않은 필드는 null → COALESCE로 기존 값 유지
  const f = parsed.fields;
  const [updated] = (await getSql()`
    UPDATE stores SET
      name        = COALESCE(${f.name ?? null}::text, name),
      category    = COALESCE(${f.category ?? null}::text, category),
      description = COALESCE(${f.description ?? null}::text, description),
      address     = COALESCE(${f.address ?? null}::text, address),
      open_hours  = COALESCE(${f.openHours ?? null}::text, open_hours),
      lat         = COALESCE(${f.lat ?? null}::float8, lat),
      lng         = COALESCE(${f.lng ?? null}::float8, lng),
      is_open     = COALESCE(${f.isOpen ?? null}::boolean, is_open),
      updated_at  = now()
    WHERE owner_id = ${guard.value.id}
    RETURNING id`) as { id: number }[];
  if (!updated) return jsonError("등록된 가게가 없어요.", 404);

  return Response.json({ store: await findStoreById(updated.id) });
}
