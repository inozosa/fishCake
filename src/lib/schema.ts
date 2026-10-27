import type { Sql } from "./db";
import { seedDemoData } from "./seed";

// 모든 문장은 여러 번 실행해도 안전(멱등)해야 한다 — `npm run db:setup`이 빌드 때마다 다시 실행한다.
const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS users (
    id            INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    email         TEXT        NOT NULL UNIQUE,
    firebase_uid  TEXT        UNIQUE,
    name          TEXT        NOT NULL,
    phone         TEXT,
    role          TEXT        NOT NULL CHECK (role IN ('owner', 'customer')),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
  )`,
  // 예전 DB용: Firebase 로그인 이전엔 firebase_uid가 없었고, 비밀번호를 직접 저장했다(이제 Firebase가 관리).
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS firebase_uid TEXT UNIQUE`,
  `ALTER TABLE users DROP COLUMN IF EXISTS password_hash`,
  `CREATE TABLE IF NOT EXISTS sessions (
    token_hash TEXT        PRIMARY KEY,
    user_id    INTEGER     NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TIMESTAMPTZ NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS sessions_user_idx ON sessions (user_id)`,
  `CREATE TABLE IF NOT EXISTS stores (
    id          INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    owner_id    INTEGER          NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    name        TEXT             NOT NULL,
    category    TEXT             NOT NULL CHECK (category IN ('bungeoppang', 'dakkochi', 'pocha')),
    description TEXT             NOT NULL DEFAULT '',
    address     TEXT             NOT NULL DEFAULT '',
    open_hours  TEXT             NOT NULL DEFAULT '',
    lat         DOUBLE PRECISION NOT NULL,
    lng         DOUBLE PRECISION NOT NULL,
    is_open     BOOLEAN          NOT NULL DEFAULT false,
    updated_at  TIMESTAMPTZ      NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS stores_lat_lng_idx ON stores (lat, lng)`,
  `CREATE TABLE IF NOT EXISTS menus (
    id         INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    store_id   INTEGER NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    name       TEXT    NOT NULL,
    price      INTEGER NOT NULL DEFAULT 0 CHECK (price >= 0),
    stock      INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
    sort_order INTEGER NOT NULL DEFAULT 0
  )`,
  `CREATE INDEX IF NOT EXISTS menus_store_idx ON menus (store_id)`,
  // 손님 제보 위치 — 사장님 인증 가게(stores)와 분리해서 '미인증' 정보로 다룬다.
  `CREATE TABLE IF NOT EXISTS reports (
    id          INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    reporter_id INTEGER          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name        TEXT             NOT NULL DEFAULT '',
    category    TEXT             NOT NULL CHECK (category IN ('bungeoppang', 'dakkochi', 'pocha')),
    address     TEXT             NOT NULL DEFAULT '',
    memo        TEXT             NOT NULL DEFAULT '',
    lat         DOUBLE PRECISION NOT NULL,
    lng         DOUBLE PRECISION NOT NULL,
    created_at  TIMESTAMPTZ      NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS reports_lat_lng_idx ON reports (lat, lng)`,
  `CREATE INDEX IF NOT EXISTS reports_reporter_idx ON reports (reporter_id, created_at)`,
  // 비밀번호 재설정 메일 요청 기록 — 남의 메일함에 메일을 퍼붓지 못하게 횟수를 제한하는 데 쓴다.
  `CREATE TABLE IF NOT EXISTS password_reset_requests (
    email      TEXT        NOT NULL,
    ip         TEXT        NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS password_reset_requests_time_idx ON password_reset_requests (created_at)`,
  `CREATE TABLE IF NOT EXISTS favorites (
    user_id    INTEGER     NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    store_id   INTEGER     NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, store_id)
  )`,
];

/**
 * 테이블을 만들고(이미 있으면 건너뜀), DB가 비어 있으면 데모 데이터를 넣는다.
 * 요청 처리 중이 아니라 배포 전에 한 번 실행한다 (scripts/db-setup.ts).
 */
export async function migrate(sql: Sql): Promise<{ seeded: boolean }> {
  await sql.transaction([
    // 빌드가 동시에 두 번 돌아도 하나씩 실행되도록 잠근다
    sql.query("SELECT pg_advisory_xact_lock(727401)"),
    ...SCHEMA.map((statement) => sql.query(statement)),
  ]);
  const [{ count }] = (await sql`SELECT count(*)::int AS count FROM users`) as { count: number }[];
  if (count > 0 || process.env.SEED_DEMO === "false") return { seeded: false };
  await seedDemoData(sql);
  return { seeded: true };
}
