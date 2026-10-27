import { CATEGORIES } from "./categories";
import type { Report, Store } from "./types";

/** 이름 없이 제보된 노점은 업종으로 부른다. */
export const reportTitle = (report: Pick<Report, "name" | "category">) =>
  report.name || `이름 모를 ${CATEGORIES[report.category].label}`;

export const formatPrice = (won: number) => `${won.toLocaleString("ko-KR")}원`;

export function formatDistance(km: number): string {
  return km < 1 ? `${Math.round(km * 1000)}m` : `${km.toFixed(1)}km`;
}

/** 카드·팝업의 보조 문구. 예) "350m · 시청역 4번 출구 앞" */
export function placeSubline(place: { distanceKm?: number; address: string }): string {
  return [place.distanceKm !== undefined ? formatDistance(place.distanceKm) : "", place.address]
    .filter(Boolean)
    .join(" · ");
}

export function timeAgo(ms: number, now = Date.now()): string {
  const minutes = Math.floor((now - ms) / 60000);
  if (minutes < 1) return "방금 전";
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  return `${Math.floor(hours / 24)}일 전`;
}

type StockLevel = "ok" | "low" | "out";

export function stockLevel(stock: number): StockLevel {
  if (stock <= 0) return "out";
  return stock <= 5 ? "low" : "ok";
}

export const stockText = (stock: number) => (stock <= 0 ? "품절" : `${stock}개 남음`);

export type StoreStatus = "open" | "soldout" | "closed";

export function storeStatus(store: Pick<Store, "isOpen" | "menus">): StoreStatus {
  if (!store.isOpen) return "closed";
  const allSoldOut = store.menus.length > 0 && store.menus.every((m) => m.stock <= 0);
  return allSoldOut ? "soldout" : "open";
}

export const STATUS_LABEL: Record<StoreStatus, string> = {
  open: "영업중",
  soldout: "전부 품절",
  closed: "영업종료",
};
