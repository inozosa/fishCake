import { requireUser } from "@/lib/auth";
import { CATEGORIES } from "@/lib/categories";
import { getSql } from "@/lib/db";
import { jsonError, readJson } from "@/lib/http";
import { parseReportInput } from "@/lib/inputs";
import { findNearbyDuplicate } from "@/lib/reports";
import type { Report } from "@/lib/types";

const DUPLICATE_RADIUS_KM = 0.03; // 30m
const DAILY_LIMIT = 10;

export async function POST(req: Request) {
  const guard = await requireUser("customer");
  if (!guard.ok) return guard.response;
  const user = guard.value;

  const body = await readJson(req);
  if (!body) return jsonError("잘못된 요청이에요.");
  const parsed = parseReportInput(body);
  if (!parsed.ok) return jsonError(parsed.error);
  const f = parsed.fields;

  const sql = getSql();
  const [[{ count }], duplicate] = await Promise.all([
    sql`SELECT count(*)::int AS count FROM reports
        WHERE reporter_id = ${user.id} AND created_at > now() - interval '1 day'`,
    findNearbyDuplicate(f, f.category, DUPLICATE_RADIUS_KM),
  ]);
  if (count >= DAILY_LIMIT) return jsonError(`제보는 하루에 ${DAILY_LIMIT}건까지 할 수 있어요.`, 429);
  if (duplicate) {
    const label = CATEGORIES[f.category].label;
    return jsonError(`30m 안에 이미 등록된 ${label} 가게가 있어요${duplicate.name ? ` (${duplicate.name})` : ""}.`, 409);
  }

  const [row] = (await sql`
    INSERT INTO reports (reporter_id, name, category, address, memo, lat, lng)
    VALUES (${user.id}, ${f.name}, ${f.category}, ${f.address}, ${f.memo}, ${f.lat}, ${f.lng})
    RETURNING id, created_at`) as { id: number; created_at: Date }[];

  const report: Report = { id: row.id, ...f, createdAt: new Date(row.created_at).getTime(), isMine: true };
  return Response.json({ report }, { status: 201 });
}
