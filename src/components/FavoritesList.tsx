"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { api, errorMessage } from "@/lib/api-client";
import type { Store } from "@/lib/types";
import { useRequireRole } from "./AuthProvider";
import { StoreCard, useFavoriteToggle } from "./StoreCard";
import { ErrorText, PageSpinner } from "./ui";

export default function FavoritesList() {
  const customer = useRequireRole("customer");
  const [stores, setStores] = useState<Store[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!customer) return;
    api<{ stores: Store[] }>("/api/favorites")
      .then((d) => setStores(d.stores))
      .catch((e) => setError(errorMessage(e)));
  }, [customer]);

  // 하트를 꺼도 목록에서 바로 지우지 않고 남겨둔다 (실수로 눌렀을 때 다시 켤 수 있게)
  const onFavoriteChange = useCallback((storeId: number, isFavorite: boolean) => {
    setStores((prev) => prev?.map((s) => (s.id === storeId ? { ...s, isFavorite } : s)) ?? null);
  }, []);
  const toggleFavorite = useFavoriteToggle(onFavoriteChange);

  if (error) {
    return (
      <div className="mx-auto max-w-md px-4 py-16">
        <ErrorText>{error}</ErrorText>
      </div>
    );
  }
  if (!stores) return <PageSpinner />;

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-6">
      <h1 className="text-2xl font-black text-zinc-900">❤️ 단골 가게</h1>
      <p className="mt-1 text-sm text-zinc-500">단골 가게의 영업 여부와 남은 수량을 한 번에 확인하세요.</p>

      {stores.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-zinc-300 bg-white px-4 py-12 text-center">
          <p className="text-3xl">🤍</p>
          <p className="mt-2 font-bold text-zinc-800">아직 단골 가게가 없어요</p>
          <p className="mt-1 text-sm text-zinc-500">지도에서 가게 카드의 하트를 눌러 단골로 등록해 보세요.</p>
          <Link href="/" className="mt-4 inline-block rounded-lg bg-orange-600 px-4 py-2 text-sm font-bold text-white">
            지도 보러 가기
          </Link>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {stores.map((store) => (
            <StoreCard key={store.id} store={store} onToggleFavorite={toggleFavorite} />
          ))}
        </div>
      )}
    </div>
  );
}
