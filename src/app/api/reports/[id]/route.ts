import type { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { getSql } from "@/lib/db";
import { jsonError, toId } from "@/lib/http";

type Ctx = RouteContext<"/api/reports/[id]">;

/** 내가 한 제보만 지울 수 있다. */
export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const guard = await requireUser("customer");
  if (!guard.ok) return guard.response;
  const reportId = toId((await ctx.params).id);

  const deleted = reportId
    ? await getSql()`DELETE FROM reports WHERE id = ${reportId} AND reporter_id = ${guard.value.id} RETURNING id`
    : [];
  if (deleted.length === 0) return jsonError("내가 한 제보만 삭제할 수 있어요.", 404);

  return Response.json({ ok: true });
}
