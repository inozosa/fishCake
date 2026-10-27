"use client";

import { CATEGORIES, CATEGORY_KEYS, type Category } from "@/lib/categories";

interface Props {
  legend: string;
  value: Category | null;
  onChange: (category: Category) => void;
  /** 버튼 아래에 붙는 안내 문구 */
  hint?: React.ReactNode;
}

/** 🐟 붕어빵 / 🍢 닭꼬치 / 🏮 포장마차 중 하나를 고르는 큰 버튼 3개 */
export function CategoryPicker({ legend, value, onChange, hint }: Props) {
  return (
    <fieldset>
      <legend className="mb-1.5 text-sm font-semibold text-zinc-800">{legend}</legend>
      <div className="grid grid-cols-3 gap-2">
        {CATEGORY_KEYS.map((key) => {
          const c = CATEGORIES[key];
          const active = value === key;
          return (
            <button
              key={key}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(key)}
              className={`rounded-2xl border-2 px-2 py-3 text-center transition ${
                active ? "bg-orange-50" : "border-zinc-200 hover:border-zinc-300"
              }`}
              style={active ? { borderColor: c.color } : undefined}
            >
              <span className="block text-3xl">{c.emoji}</span>
              <span className="mt-1 block text-sm font-bold text-zinc-800">{c.label}</span>
            </button>
          );
        })}
      </div>
      {hint && <p className="mt-2 text-xs text-zinc-500">{hint}</p>}
    </fieldset>
  );
}
