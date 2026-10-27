import type { Category } from "./categories";
import type { Sql } from "./db";

export interface NewOwner {
  email: string;
  /** 데모 계정은 db:setup이 나중에 Firebase 계정과 연결하므로 null */
  firebaseUid: string | null;
  name: string;
  phone: string;
  store: {
    name: string;
    category: Category;
    description: string;
    address: string;
    openHours: string;
    lat: number;
    lng: number;
    isOpen: boolean;
    minutesAgo?: number;
  };
  menus: { name: string; price: number; stock: number }[];
}

/**
 * 사장님 계정 + 가게 + 메뉴를 한 문장(=원자적)으로 만드는 쿼리.
 * await하지 않은 채로 sql.transaction([...])에 넣을 수도 있다. 결과: [{ id: 사장님 user id }]
 */
export function insertOwnerWithStore(sql: Sql, owner: NewOwner) {
  const { store } = owner;
  const menus = owner.menus.map((m, ord) => ({ ...m, ord }));
  return sql.query(
    `WITH u AS (
       INSERT INTO users (email, firebase_uid, name, phone, role)
       VALUES ($1, $2, $3, $4, 'owner')
       RETURNING id
     ), s AS (
       INSERT INTO stores (owner_id, name, category, description, address, open_hours, lat, lng, is_open, updated_at)
       SELECT u.id, $5::text, $6::text, $7::text, $8::text, $9::text, $10::float8, $11::float8, $12::boolean,
              now() - make_interval(mins => $13::int)
       FROM u
       RETURNING id
     ), m AS (
       INSERT INTO menus (store_id, name, price, stock, sort_order)
       SELECT s.id, x.name, x.price, x.stock, x.ord
       FROM s, jsonb_to_recordset($14::jsonb) AS x(name text, price int, stock int, ord int)
     )
     SELECT id FROM u`,
    [
      owner.email,
      owner.firebaseUid,
      owner.name,
      owner.phone,
      store.name,
      store.category,
      store.description,
      store.address,
      store.openHours,
      store.lat,
      store.lng,
      store.isOpen,
      store.minutesAgo ?? 0,
      JSON.stringify(menus),
    ],
  );
}
