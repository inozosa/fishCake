import type { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { isValidLatLng } from "@/lib/geo";
import { jsonError } from "@/lib/http";
import { findReportsNear } from "@/lib/reports";
import { findStoresNear } from "@/lib/stores";

const MAX_RADIUS_KM = 10; // 화면에서 고를 수 있는 최대 반경과 같게

/** 주변의 사장님 인증 가게(stores)와 손님 제보 위치(reports)를 함께 돌려준다. */
export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const lat = parseFloat(params.get("lat") ?? "");
  const lng = parseFloat(params.get("lng") ?? "");
  if (!isValidLatLng(lat, lng)) return jsonError("lat, lng 파라미터가 필요해요.");

  const radius = Math.min(Math.max(parseFloat(params.get("radius") ?? "") || 3, 0.3), MAX_RADIUS_KM);
  const user = await getCurrentUser();
  const origin = { lat, lng };

  const [stores, reports] = await Promise.all([
    findStoresNear(origin, radius, user?.id),
    findReportsNear(origin, radius, user?.id),
  ]);
  return Response.json({ stores, reports });
}
