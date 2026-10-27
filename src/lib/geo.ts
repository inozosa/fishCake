import type { LatLng } from "./types";

/** 위치 권한이 없을 때 보여줄 기본 위치 (서울시청) */
export const DEFAULT_CENTER: LatLng = { lat: 37.5663, lng: 126.9779 };

export function distanceKm(a: LatLng, b: LatLng): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

/** 주변 조회 때 가까운 순으로 이 개수까지만 돌려준다 (지도·목록이 너무 무거워지지 않게). */
export const MAX_NEARBY = 200;

/** 이 위도에서 경도 1도가 위도 1도에 비해 얼마나 짧은지 (근사 거리 계산용) */
export const lngScale = (lat: number) => Math.cos((lat * Math.PI) / 180);

/** 반경을 감싸는 위경도 박스 [minLat, maxLat, minLng, maxLng] — 인덱스로 1차 필터링할 때 쓴다. */
export function boundingBox(origin: LatLng, radiusKm: number): [number, number, number, number] {
  const dLat = radiusKm / 111.32;
  const dLng = dLat / lngScale(origin.lat);
  return [origin.lat - dLat, origin.lat + dLat, origin.lng - dLng, origin.lng + dLng];
}

export function isValidLatLng(lat: unknown, lng: unknown): boolean {
  return (
    typeof lat === "number" &&
    typeof lng === "number" &&
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    Math.abs(lat) <= 90 &&
    Math.abs(lng) <= 180
  );
}

/** 브라우저 전용: 현재 위치를 Promise로 받아온다. */
export function getCurrentPosition(): Promise<LatLng> {
  return new Promise((resolve, reject) => {
    if (!("geolocation" in navigator)) {
      reject(new Error("이 브라우저는 위치 기능을 지원하지 않아요."));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => reject(new Error("현재 위치를 가져오지 못했어요. 위치 권한을 확인해 주세요.")),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  });
}
