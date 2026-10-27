export const CATEGORIES = {
  bungeoppang: { label: "붕어빵", emoji: "🐟", color: "#d97706" },
  dakkochi: { label: "닭꼬치", emoji: "🍢", color: "#dc2626" },
  pocha: { label: "포장마차", emoji: "🏮", color: "#7c3aed" },
} as const;

export type Category = keyof typeof CATEGORIES;

export const CATEGORY_KEYS = Object.keys(CATEGORIES) as Category[];

export function isCategory(value: unknown): value is Category {
  return typeof value === "string" && Object.hasOwn(CATEGORIES, value);
}

// 사장님 가입 시 업종별로 미리 채워 주는 메뉴 (가입 후 자유롭게 수정 가능)
export const DEFAULT_MENUS: Record<Category, { name: string; price: number }[]> = {
  bungeoppang: [
    { name: "팥 붕어빵 (3개)", price: 2000 },
    { name: "슈크림 붕어빵 (3개)", price: 2000 },
  ],
  dakkochi: [
    { name: "소금 닭꼬치", price: 3000 },
    { name: "양념 닭꼬치", price: 3000 },
  ],
  pocha: [
    { name: "떡볶이 (1인분)", price: 4000 },
    { name: "어묵 (1개)", price: 1000 },
    { name: "순대 (1인분)", price: 4000 },
  ],
};
