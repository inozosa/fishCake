import type { Category } from "./categories";
import { getSql } from "./db";
import { MAX_NEARBY, boundingBox, distanceKm, lngScale } from "./geo";
import type { LatLng, Report } from "./types";

interface ReportRow {
  id: number;
  name: string;
  category: Category;
  address: string;
  memo: string;
  lat: number;
  lng: number;
  created_at: Date;
  reporter_id: number;
}

// 제보자 이름은 공개하지 않는다 (Google로 가입하면 닉네임이 실명이라서).
export async function findReportsNear(origin: LatLng, radiusKm: number, userId?: number): Promise<Report[]> {
  const [minLat, maxLat, minLng, maxLng] = boundingBox(origin, radiusKm);
  const rows = (await getSql()`
    SELECT id, name, category, address, memo, lat, lng, created_at, reporter_id FROM reports
    WHERE lat BETWEEN ${minLat} AND ${maxLat} AND lng BETWEEN ${minLng} AND ${maxLng}
    ORDER BY power(lat - ${origin.lat}, 2) + power((lng - ${origin.lng}) * ${lngScale(origin.lat)}, 2)
    LIMIT ${MAX_NEARBY}`) as ReportRow[];

  return rows
    .map(({ created_at, reporter_id, ...r }) => ({
      ...r,
      createdAt: new Date(created_at).getTime(),
      isMine: reporter_id === userId,
      distanceKm: distanceKm(origin, r),
    }))
    .filter((r) => r.distanceKm <= radiusKm)
    .sort((a, b) => a.distanceKm - b.distanceKm);
}

/** 같은 업종의 가게(인증·제보 모두)가 이미 아주 가까이 있으면 그 이름을 돌려준다. */
export async function findNearbyDuplicate(pos: LatLng, category: Category, withinKm: number) {
  const [minLat, maxLat, minLng, maxLng] = boundingBox(pos, withinKm);
  const nearby = (await getSql()`
    SELECT name, lat, lng FROM stores
    WHERE category = ${category} AND lat BETWEEN ${minLat} AND ${maxLat} AND lng BETWEEN ${minLng} AND ${maxLng}
    UNION ALL
    SELECT name, lat, lng FROM reports
    WHERE category = ${category} AND lat BETWEEN ${minLat} AND ${maxLat} AND lng BETWEEN ${minLng} AND ${maxLng}
  `) as { name: string; lat: number; lng: number }[];
  return nearby.find((p) => distanceKm(pos, p) <= withinKm) ?? null;
}
