import { getSql } from "./db";
import { MAX_NEARBY, boundingBox, distanceKm, lngScale } from "./geo";
import type { Category } from "./categories";
import type { LatLng, Menu, Store } from "./types";

interface StoreRow {
  id: number;
  name: string;
  category: Category;
  description: string;
  address: string;
  open_hours: string;
  lat: number;
  lng: number;
  is_open: boolean;
  updated_at: Date;
  menus: Menu[];
  is_favorite: boolean;
}

// 가게 + 메뉴 목록 + (로그인한 손님 기준) 단골 여부를 한 번의 쿼리로 가져온다. $1 = userId
const STORE_SELECT = `
  SELECT s.id, s.name, s.category, s.description, s.address, s.open_hours, s.lat, s.lng, s.is_open, s.updated_at,
    COALESCE((
      SELECT json_agg(json_build_object('id', m.id, 'name', m.name, 'price', m.price, 'stock', m.stock)
                      ORDER BY m.sort_order, m.id)
      FROM menus m WHERE m.store_id = s.id
    ), '[]'::json) AS menus,
    EXISTS (SELECT 1 FROM favorites f WHERE f.store_id = s.id AND f.user_id = $1) AS is_favorite
  FROM stores s`;

async function selectStores(clause: string, params: unknown[], userId?: number): Promise<Store[]> {
  const sql = getSql();
  const rows = (await sql.query(`${STORE_SELECT} ${clause}`, [userId ?? 0, ...params])) as StoreRow[];
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    category: r.category,
    description: r.description,
    address: r.address,
    openHours: r.open_hours,
    lat: r.lat,
    lng: r.lng,
    isOpen: r.is_open,
    updatedAt: new Date(r.updated_at).getTime(),
    menus: r.menus,
    isFavorite: r.is_favorite,
  }));
}

export async function findStoresNear(origin: LatLng, radiusKm: number, userId?: number): Promise<Store[]> {
  // 위경도 박스로 인덱스를 타서 거르고 가까운 순(근사)으로 자른 뒤, 실제 거리로 다시 거른다.
  const stores = await selectStores(
    `WHERE s.lat BETWEEN $2 AND $3 AND s.lng BETWEEN $4 AND $5
     ORDER BY power(s.lat - $6, 2) + power((s.lng - $7) * $8, 2) LIMIT ${MAX_NEARBY}`,
    [...boundingBox(origin, radiusKm), origin.lat, origin.lng, lngScale(origin.lat)],
    userId,
  );
  return stores
    .map((s) => ({ ...s, distanceKm: distanceKm(origin, s) }))
    .filter((s) => s.distanceKm <= radiusKm)
    .sort((a, b) => a.distanceKm - b.distanceKm);
}

export function findFavoriteStores(userId: number): Promise<Store[]> {
  return selectStores(
    "JOIN favorites fav ON fav.store_id = s.id AND fav.user_id = $1 ORDER BY fav.created_at DESC",
    [],
    userId,
  );
}

export async function findStoreByOwner(ownerId: number): Promise<Store | null> {
  const [store] = await selectStores("WHERE s.owner_id = $2", [ownerId]);
  return store ?? null;
}

export async function findStoreById(storeId: number): Promise<Store | null> {
  const [store] = await selectStores("WHERE s.id = $2", [storeId]);
  return store ?? null;
}
