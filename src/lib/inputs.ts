import { isCategory, type Category } from "./categories";
import { isValidLatLng } from "./geo";
import { MAX_PRICE, MAX_STOCK, cleanText, toInt } from "./http";

type Parsed<T> = { ok: true; fields: T } | { ok: false; error: string };

const fail = (error: string) => ({ ok: false, error }) as const;

export interface StoreFields {
  name?: string;
  category?: Category;
  description?: string;
  address?: string;
  openHours?: string;
  lat?: number;
  lng?: number;
  isOpen?: boolean;
}

/** parseStoreInput(input, false)가 성공하면 보장되는 필드 */
export type NewStoreFields = StoreFields & Required<Pick<StoreFields, "name" | "category" | "lat" | "lng">>;

/** partial=false면 가게 이름·업종·위치가 필수 (가입 시), true면 들어온 필드만 검사 (수정 시). */
export function parseStoreInput(input: Record<string, unknown>, partial: boolean): Parsed<StoreFields> {
  const has = (key: string) => !partial || key in input;
  const fields: StoreFields = {};

  if (has("name")) {
    const name = cleanText(input.name, 40);
    if (!name) return fail("가게 이름을 입력해 주세요.");
    fields.name = name;
  }
  if (has("category")) {
    if (!isCategory(input.category)) return fail("업종을 선택해 주세요.");
    fields.category = input.category;
  }
  if (has("lat") || has("lng")) {
    if (!isValidLatLng(input.lat, input.lng)) return fail("지도에서 가게 위치를 선택해 주세요.");
    fields.lat = input.lat as number;
    fields.lng = input.lng as number;
  }
  if ("description" in input) fields.description = cleanText(input.description, 200);
  if ("address" in input) fields.address = cleanText(input.address, 100);
  if ("openHours" in input) fields.openHours = cleanText(input.openHours, 50);
  if ("isOpen" in input) fields.isOpen = input.isOpen === true;

  return { ok: true, fields };
}

export interface ReportFields {
  name: string;
  category: Category;
  address: string;
  memo: string;
  lat: number;
  lng: number;
}

export function parseReportInput(input: Record<string, unknown>): Parsed<ReportFields> {
  if (!isCategory(input.category)) return fail("업종을 선택해 주세요.");
  if (!isValidLatLng(input.lat, input.lng)) return fail("지도에서 제보할 위치를 찍어 주세요.");
  return {
    ok: true,
    fields: {
      name: cleanText(input.name, 40),
      category: input.category,
      address: cleanText(input.address, 100),
      memo: cleanText(input.memo, 200),
      lat: input.lat as number,
      lng: input.lng as number,
    },
  };
}

export interface MenuFields {
  name?: string;
  price?: number;
  stock?: number;
  /** 현재 수량에 더할 값 (+1, -1, +10 버튼) */
  delta?: number;
}

export function parseMenuInput(input: Record<string, unknown>, partial: boolean): Parsed<MenuFields> {
  const has = (key: string) => !partial || key in input;
  const fields: MenuFields = {};

  if (has("name")) {
    const name = cleanText(input.name, 30);
    if (!name) return fail("메뉴 이름을 입력해 주세요.");
    fields.name = name;
  }
  if (has("price")) {
    const price = toInt(input.price, 0, MAX_PRICE);
    if (price === null) return fail("가격은 0 ~ 1,000,000원 사이 숫자로 입력해 주세요.");
    fields.price = price;
  }
  if ("stock" in input) {
    const stock = toInt(input.stock, 0, MAX_STOCK);
    if (stock === null) return fail(`수량은 0 ~ ${MAX_STOCK} 사이 숫자로 입력해 주세요.`);
    fields.stock = stock;
  }
  if ("delta" in input) {
    const delta = toInt(input.delta, -MAX_STOCK, MAX_STOCK);
    if (delta === null) return fail("수량 변경 값이 올바르지 않아요.");
    fields.delta = delta;
  }
  return { ok: true, fields };
}
