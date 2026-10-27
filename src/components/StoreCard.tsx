"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { api, errorMessage } from "@/lib/api-client";
import { formatPrice, placeSubline, storeStatus, timeAgo } from "@/lib/format";
import type { Store } from "@/lib/types";
import { useAuth } from "./AuthProvider";
import { PlaceCard } from "./PlaceCard";
import { storeKey } from "./map/place-keys";
import { StatusPill, StockBadge } from "./ui";

interface Props {
  store: Store;
  selected?: boolean;
  onSelect?: (store: Store) => void;
  onToggleFavorite?: (store: Store) => void;
}

export function StoreCard({ store, selected, onSelect, onToggleFavorite }: Props) {
  const status = storeStatus(store);

  return (
    <PlaceCard
      id={storeKey(store.id)}
      variant="store"
      category={store.category}
      title={store.name}
      subline={placeSubline(store)}
      badge={<StatusPill status={status} />}
      dimmed={status === "closed"}
      selected={selected}
      onSelect={onSelect && (() => onSelect(store))}
      action={
        onToggleFavorite && (
          <button
            type="button"
            aria-label={store.isFavorite ? "단골 해제" : "단골 등록"}
            aria-pressed={store.isFavorite}
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(store);
            }}
            className="-m-1 rounded-full p-1.5 text-xl transition hover:scale-110"
          >
            {store.isFavorite ? "❤️" : "🤍"}
          </button>
        )
      }
    >
      {store.description && <p className="mt-2 text-sm text-zinc-600">{store.description}</p>}

      {store.menus.length > 0 ? (
        <ul className="mt-3 divide-y divide-dashed divide-zinc-200 rounded-xl bg-zinc-50 px-3">
          {store.menus.map((menu) => (
            <li key={menu.id} className="flex items-center justify-between gap-2 py-2 text-sm">
              <span className={`min-w-0 truncate ${menu.stock <= 0 || !store.isOpen ? "text-zinc-400" : "text-zinc-800"}`}>
                {menu.name} <span className="text-xs text-zinc-400">{formatPrice(menu.price)}</span>
              </span>
              <StockBadge stock={menu.stock} muted={!store.isOpen} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 rounded-xl bg-zinc-50 px-3 py-2 text-sm text-zinc-400">아직 등록된 메뉴가 없어요</p>
      )}

      <p className="mt-2 text-[11px] text-zinc-400">
        {timeAgo(store.updatedAt)} 업데이트
        {store.openHours && ` · 영업시간 ${store.openHours}`}
      </p>
    </PlaceCard>
  );
}

/**
 * 단골 등록/해제. 낙관적으로 먼저 화면을 바꾸고, 실패하면 되돌린다.
 * 사장님 계정이면 undefined를 돌려줘서 하트 버튼을 숨긴다.
 */
export function useFavoriteToggle(onChange: (storeId: number, isFavorite: boolean) => void) {
  const { user } = useAuth();
  const router = useRouter();

  const toggle = useCallback(
    async (store: Store) => {
      if (!user) {
        if (confirm("단골 가게 등록은 손님 회원만 할 수 있어요.\n로그인 페이지로 이동할까요?")) router.push("/login");
        return;
      }
      const next = !store.isFavorite;
      onChange(store.id, next);
      try {
        await api(`/api/favorites/${store.id}`, { method: next ? "POST" : "DELETE" });
      } catch (e) {
        onChange(store.id, !next);
        alert(errorMessage(e));
      }
    },
    [user, router, onChange],
  );

  return user?.role === "owner" ? undefined : toggle;
}
