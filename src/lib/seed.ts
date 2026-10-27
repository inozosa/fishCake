import type { Category } from "./categories";
import type { Sql } from "./db";
import { insertOwnerWithStore } from "./owner-signup";

/** 데모 계정 비밀번호 (모든 데모 계정 공통) */
const DEMO_PASSWORD = "demo1234";
// 메일이 실제로 가지 않는 예약 도메인 — 누가 데모 계정의 비밀번호 재설정을 눌러도 아무에게도 메일이 안 간다.
const DEMO_DOMAIN = "example.com";
const DEMO_GUEST = `guest@${DEMO_DOMAIN}`;

interface SeedStore {
  name: string;
  category: Category;
  lat: number;
  lng: number;
  address: string;
  description: string;
  openHours: string;
  isOpen: boolean;
  minutesAgo: number;
  menus: [name: string, price: number, stock: number][];
}

// 서울시청 주변 데모 가게들
const STORES: SeedStore[] = [
  {
    name: "시청역 황금붕어빵",
    category: "bungeoppang",
    lat: 37.5659,
    lng: 126.9772,
    address: "시청역 4번 출구 앞",
    description: "겉바속촉 황금 붕어빵! 팥을 꼬리까지 꽉 채웠어요.",
    openHours: "15:00 ~ 22:00",
    isOpen: true,
    minutesAgo: 3,
    menus: [
      ["팥 붕어빵 (3개)", 2000, 24],
      ["슈크림 붕어빵 (3개)", 2000, 0],
      ["피자 붕어빵 (1개)", 1500, 7],
    ],
  },
  {
    name: "명동 미니붕어빵",
    category: "bungeoppang",
    lat: 37.5612,
    lng: 126.9858,
    address: "명동역 6번 출구 골목",
    description: "한 입에 쏙! 미니 붕어빵 전문",
    openHours: "13:00 ~ 21:00",
    isOpen: true,
    minutesAgo: 12,
    menus: [
      ["미니 붕어빵 (10개)", 3000, 40],
      ["미니 슈크림 (10개)", 3000, 15],
    ],
  },
  {
    name: "광화문 붕어빵 아저씨",
    category: "bungeoppang",
    lat: 37.5718,
    lng: 126.9762,
    address: "광화문역 2번 출구",
    description: "20년 경력 붕어빵 장인",
    openHours: "07:00 ~ 12:00",
    isOpen: false,
    minutesAgo: 300,
    menus: [
      ["팥 붕어빵 (4개)", 2000, 0],
      ["고구마 붕어빵 (4개)", 2000, 0],
    ],
  },
  {
    name: "덕수궁 돌담길 붕어빵",
    category: "bungeoppang",
    lat: 37.5651,
    lng: 126.9739,
    address: "덕수궁 돌담길 입구",
    description: "산책길에 따끈한 붕어빵 하나",
    openHours: "12:00 ~ 20:00",
    isOpen: true,
    minutesAgo: 18,
    menus: [
      ["팥 붕어빵 (3개)", 2000, 9],
      ["크림치즈 붕어빵 (2개)", 2500, 4],
    ],
  },
  {
    name: "을지로 원조 숯불닭꼬치",
    category: "dakkochi",
    lat: 37.5664,
    lng: 126.9905,
    address: "을지로3가역 11번 출구",
    description: "숯불에 직접 구운 닭꼬치",
    openHours: "17:00 ~ 01:00",
    isOpen: true,
    minutesAgo: 1,
    menus: [
      ["소금 닭꼬치", 3000, 15],
      ["양념 닭꼬치", 3000, 8],
      ["매운 닭꼬치", 3500, 3],
      ["닭껍질 꼬치", 2500, 0],
    ],
  },
  {
    name: "남대문 불꽃 닭꼬치",
    category: "dakkochi",
    lat: 37.5594,
    lng: 126.9772,
    address: "남대문시장 2번 게이트",
    description: "데리야끼 소스가 일품",
    openHours: "11:00 ~ 21:00",
    isOpen: true,
    minutesAgo: 25,
    menus: [
      ["데리야끼 닭꼬치", 3500, 22],
      ["파닭꼬치", 4000, 11],
    ],
  },
  {
    name: "종각 이모네 포장마차",
    category: "pocha",
    lat: 37.5699,
    lng: 126.9838,
    address: "종각역 젊음의거리 입구",
    description: "떡볶이, 어묵, 튀김 다 있어요",
    openHours: "16:00 ~ 02:00",
    isOpen: true,
    minutesAgo: 6,
    menus: [
      ["떡볶이 (1인분)", 4000, 18],
      ["어묵 (1개)", 1000, 45],
      ["순대 (1인분)", 4000, 0],
      ["모듬 튀김 (5개)", 5000, 6],
    ],
  },
  {
    name: "서울역 따끈 포장마차",
    category: "pocha",
    lat: 37.5551,
    lng: 126.9713,
    address: "서울역 버스환승센터 옆",
    description: "추운 날엔 어묵탕 한 그릇",
    openHours: "18:00 ~ 03:00",
    isOpen: true,
    minutesAgo: 40,
    menus: [
      ["잔치국수", 5000, 12],
      ["어묵탕", 6000, 9],
      ["김밥 (1줄)", 3000, 2],
    ],
  },
  {
    name: "청계천 광교 포차",
    category: "pocha",
    lat: 37.5691,
    lng: 126.9868,
    address: "광교 사거리 청계천변",
    description: "청계천 보며 한잔",
    openHours: "19:00 ~ 02:00",
    isOpen: false,
    minutesAgo: 60 * 26,
    menus: [
      ["떡볶이 (1인분)", 4000, 0],
      ["어묵 (1개)", 1000, 0],
    ],
  },
];

// 데모 손님이 제보한 위치들
const REPORTS: {
  name: string;
  category: Category;
  lat: number;
  lng: number;
  address: string;
  memo: string;
  minutesAgo: number;
}[] = [
  {
    name: "",
    category: "bungeoppang",
    lat: 37.5676,
    lng: 126.981,
    address: "청계광장 건너편 버스정류장 옆",
    memo: "팥붕 4개 2,000원\n오후에만 나오시는 것 같아요",
    minutesAgo: 60 * 48,
  },
  {
    name: "서소문 닭꼬치 할머니",
    category: "dakkochi",
    lat: 37.5627,
    lng: 126.9745,
    address: "서소문공원 입구",
    memo: "양념 닭꼬치 2,500원. 저녁 6시 이후에 계세요",
    minutesAgo: 60 * 5,
  },
  {
    name: "무교동 트럭 포차",
    category: "pocha",
    lat: 37.5687,
    lng: 126.9795,
    address: "무교로 골목 안쪽",
    memo: "어묵이랑 떡볶이 팔아요",
    minutesAgo: 60 * 24,
  },
];

/** 데모 가게·계정·제보를 넣는다. 로그인은 linkDemoAccounts()가 Firebase 계정을 연결한 뒤에 된다. */
export async function seedDemoData(sql: Sql) {
  await sql.transaction([
    sql`INSERT INTO users (email, name, role) VALUES (${DEMO_GUEST}, '데모손님', 'customer')`,
    ...STORES.map(({ menus, ...store }, i) =>
      insertOwnerWithStore(sql, {
        email: `owner${i + 1}@${DEMO_DOMAIN}`,
        firebaseUid: null,
        name: `${store.name} 사장님`,
        phone: "010-0000-0000",
        store,
        menus: menus.map(([name, price, stock]) => ({ name, price, stock })),
      }),
    ),
    ...REPORTS.map(
      (r) => sql`
        INSERT INTO reports (reporter_id, name, category, address, memo, lat, lng, created_at)
        SELECT id, ${r.name}::text, ${r.category}::text, ${r.address}::text, ${r.memo}::text,
               ${r.lat}::float8, ${r.lng}::float8, now() - make_interval(mins => ${r.minutesAgo}::int)
        FROM users WHERE email = ${DEMO_GUEST}`,
    ),
  ]);
}

/**
 * Firebase 계정이 없는 데모 계정을 Firebase에 만들고(이미 있으면 로그인해서 uid를 얻어) 연결한다.
 * 비밀번호는 Firebase가 관리하므로, 이렇게 해야 데모 계정으로 로그인할 수 있다. 연결한 개수를 돌려준다.
 */
export async function linkDemoAccounts(sql: Sql): Promise<number> {
  const rows = (await sql`
    SELECT id, email FROM users WHERE firebase_uid IS NULL AND email LIKE ${`%@${DEMO_DOMAIN}`}`) as {
    id: number;
    email: string;
  }[];
  if (rows.length === 0) return 0;

  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  if (!apiKey) throw new Error("NEXT_PUBLIC_FIREBASE_API_KEY가 없어요.");
  for (const { id, email } of rows) {
    const uid = await firebaseUidFor(apiKey, email, DEMO_PASSWORD);
    await sql`UPDATE users SET firebase_uid = ${uid} WHERE id = ${id}`;
  }
  return rows.length;
}

/** 이메일 계정을 만들고, 이미 있으면 로그인해서 uid를 얻는다 (Firebase Auth REST API). */
async function firebaseUidFor(apiKey: string, email: string, password: string): Promise<string> {
  const call = async (method: "signUp" | "signInWithPassword") => {
    const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:${method}?key=${apiKey}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message ?? `Firebase ${method} 실패`);
    return data.localId as string;
  };
  try {
    return await call("signUp");
  } catch (e) {
    if (!(e as Error).message.startsWith("EMAIL_EXISTS")) throw e;
    return call("signInWithPassword");
  }
}
