"use client";

import { CATEGORIES, type Category } from "@/lib/categories";

const VARIANT = {
  // 사장님 인증 가게: 실선
  store: {
    card: "border bg-white",
    hover: "cursor-pointer hover:border-orange-300 hover:shadow-md",
    selected: "border-orange-500 shadow-md ring-2 ring-orange-200",
    idle: "border-zinc-200",
  },
  // 손님 제보 위치: 점선
  report: {
    card: "border-2 border-dashed bg-white/80",
    hover: "cursor-pointer hover:border-indigo-300 hover:bg-white",
    selected: "border-indigo-500 bg-white ring-2 ring-indigo-100",
    idle: "border-zinc-300",
  },
};

interface Props {
  id: string;
  variant: keyof typeof VARIANT;
  category: Category;
  title: string;
  subline: string;
  badge: React.ReactNode;
  /** 오른쪽 위 버튼 (하트, 삭제 등) */
  action?: React.ReactNode;
  /** 영업종료 가게처럼 흐리게 보여줄지 */
  dimmed?: boolean;
  selected?: boolean;
  onSelect?: () => void;
  children: React.ReactNode;
}

/** 목록 카드의 공통 틀 — 인증 가게와 제보 위치를 같은 구조, 다른 테두리로 보여준다. */
export function PlaceCard({ id, variant, category, title, subline, badge, action, dimmed, selected, onSelect, children }: Props) {
  const c = CATEGORIES[category];
  const v = VARIANT[variant];
  return (
    <article
      id={id}
      role={onSelect ? "button" : undefined}
      tabIndex={onSelect ? 0 : undefined}
      onClick={onSelect}
      onKeyDown={(e) => {
        // 안쪽 버튼(하트·삭제)에서 누른 키는 카드 선택으로 번지지 않게
        if (e.target !== e.currentTarget || (e.key !== "Enter" && e.key !== " ")) return;
        e.preventDefault();
        onSelect?.();
      }}
      className={`rounded-2xl p-4 text-left transition ${v.card} ${onSelect ? v.hover : ""} ${selected ? v.selected : v.idle}`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`grid h-11 w-11 shrink-0 place-items-center rounded-full text-xl ${
            variant === "report" ? "border-2 border-dashed" : ""
          } ${dimmed ? "grayscale" : ""}`}
          style={variant === "report" ? { borderColor: c.color } : { backgroundColor: `${c.color}1f` }}
          aria-hidden
        >
          {c.emoji}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-bold" style={{ color: c.color }}>
              {c.label}
            </span>
            {badge}
          </div>
          <h3 className="mt-0.5 truncate text-[15px] font-bold text-zinc-900">{title}</h3>
          {subline && <p className="truncate text-xs text-zinc-500">{subline}</p>}
        </div>
        {action}
      </div>
      {children}
    </article>
  );
}
