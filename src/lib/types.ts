import type { Category } from "./categories";

export type Role = "owner" | "customer";

export interface PublicUser {
  id: number;
  email: string;
  name: string;
  role: Role;
}

export interface LatLng {
  lat: number;
  lng: number;
}

export interface Menu {
  id: number;
  name: string;
  price: number;
  stock: number;
}

export interface Store extends LatLng {
  id: number;
  name: string;
  category: Category;
  description: string;
  address: string;
  openHours: string;
  isOpen: boolean;
  /** epoch ms — 사장님이 마지막으로 정보를 바꾼 시각 */
  updatedAt: number;
  menus: Menu[];
  isFavorite: boolean;
  distanceKm?: number;
}

/** 손님이 제보한 위치. 사장님이 인증하지 않았으므로 영업 여부·수량 정보가 없다. */
export interface Report extends LatLng {
  id: number;
  /** 비어 있을 수 있음 (이름 모르는 노점) */
  name: string;
  category: Category;
  address: string;
  /** 메뉴·가격·영업 시간대 등 제보자가 남긴 메모 */
  memo: string;
  /** epoch ms */
  createdAt: number;
  isMine: boolean;
  distanceKm?: number;
}
