"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRequireRole } from "@/components/AuthProvider";
import { LocationField } from "@/components/map/LocationField";
import { ErrorText, Field, PageSpinner, StockBadge, btnGhost, btnPrimary, inputCls } from "@/components/ui";
import { api, errorMessage } from "@/lib/api-client";
import { CATEGORIES, CATEGORY_KEYS, type Category } from "@/lib/categories";
import { formatPrice, timeAgo } from "@/lib/format";
import { getCurrentPosition } from "@/lib/geo";
import type { LatLng, Menu, Store } from "@/lib/types";

/** 변경 요청을 보내고, 서버가 돌려준 최신 가게 정보로 화면을 갱신한다. 성공하면 true. */
type Mutate = (path: string, method: string, body?: unknown) => Promise<boolean>;

export default function OwnerDashboard() {
  const owner = useRequireRole("owner");
  const [store, setStore] = useState<Store | null>(null);
  const [loadError, setLoadError] = useState("");
  const [toast, setToast] = useState("");
  const latestRequest = useRef(0);

  useEffect(() => {
    if (!owner) return;
    api<{ store: Store }>("/api/owner/store")
      .then((d) => setStore(d.store))
      .catch((e) => setLoadError(errorMessage(e)));
  }, [owner]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  const mutate = useCallback<Mutate>(async (path, method, body) => {
    const requestId = ++latestRequest.current;
    try {
      const data = await api<{ store: Store }>(path, { method, body });
      // +/− 를 빠르게 연타하면 응답 순서가 뒤바뀔 수 있다 — 가장 마지막에 보낸 요청의 응답만 화면에 반영
      if (requestId === latestRequest.current) setStore(data.store);
      return true;
    } catch (e) {
      setToast(errorMessage(e));
      return false;
    }
  }, []);

  if (loadError) {
    return (
      <div className="mx-auto max-w-md px-4 py-16">
        <ErrorText>{loadError}</ErrorText>
      </div>
    );
  }
  if (!store) return <PageSpinner label="가게 정보를 불러오는 중…" />;

  return (
    <div className="mx-auto w-full max-w-3xl space-y-5 px-4 py-6">
      <StatusCard store={store} mutate={mutate} onToast={setToast} />
      <MenuSection store={store} mutate={mutate} />
      {/* 위치가 바뀌면(지금 위치로 옮기기 등) 폼을 새 값으로 다시 그린다 */}
      <StoreInfoSection key={`${store.lat},${store.lng}`} store={store} mutate={mutate} onToast={setToast} />

      {toast && (
        <div
          role="status"
          className="fixed bottom-6 left-1/2 z-[1200] -translate-x-1/2 rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white shadow-xl"
        >
          {toast}
        </div>
      )}
    </div>
  );
}

function StatusCard({ store, mutate, onToast }: { store: Store; mutate: Mutate; onToast: (msg: string) => void }) {
  const [busy, setBusy] = useState(false);
  const category = CATEGORIES[store.category];
  const totalStock = store.menus.reduce((sum, m) => sum + m.stock, 0);
  const soldOut = store.menus.filter((m) => m.stock <= 0).length;

  async function toggleOpen() {
    setBusy(true);
    await mutate("/api/owner/store", "PATCH", { isOpen: !store.isOpen });
    setBusy(false);
  }

  async function moveHere() {
    if (!confirm("지금 계신 위치로 가게 위치를 옮길까요?")) return;
    setBusy(true);
    try {
      const pos = await getCurrentPosition();
      if (await mutate("/api/owner/store", "PATCH", pos)) onToast("가게 위치를 현재 위치로 옮겼어요 📍");
    } catch (e) {
      onToast(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section
      className={`rounded-3xl p-5 text-white shadow-lg transition-colors sm:p-6 ${
        store.isOpen ? "bg-gradient-to-br from-orange-500 to-red-500" : "bg-zinc-700"
      }`}
    >
      <p className="text-sm font-semibold opacity-90">
        {category.emoji} {category.label}
      </p>
      <h1 className="mt-1 text-2xl font-black sm:text-3xl">{store.name}</h1>
      <p className="mt-1 text-sm opacity-90">
        {store.isOpen ? "지금 손님 지도에 '영업중'으로 보이고 있어요." : "지금은 손님 지도에 '영업종료'로 보여요."}
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          onClick={toggleOpen}
          disabled={busy}
          className="rounded-2xl bg-white px-5 py-3 text-base font-black text-zinc-900 shadow transition hover:scale-[1.02] active:scale-95 disabled:opacity-60"
        >
          {store.isOpen ? "🌙 영업 종료하기" : "🔥 영업 시작하기"}
        </button>
        <button
          onClick={moveHere}
          disabled={busy}
          className="rounded-2xl bg-white/15 px-4 py-3 text-sm font-bold ring-1 ring-white/40 transition hover:bg-white/25 disabled:opacity-60"
        >
          📍 지금 위치로 가게 옮기기
        </button>
        <Link
          href="/"
          className="rounded-2xl bg-white/15 px-4 py-3 text-sm font-bold ring-1 ring-white/40 transition hover:bg-white/25"
        >
          🗺️ 지도에서 보기
        </Link>
      </div>

      <dl className="mt-5 grid grid-cols-3 gap-2 text-center">
        {[
          ["메뉴", `${store.menus.length}개`],
          ["남은 수량 합계", `${totalStock}개`],
          ["품절 메뉴", `${soldOut}개`],
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl bg-black/15 px-2 py-2.5">
            <dt className="text-[11px] opacity-80">{label}</dt>
            <dd className="text-lg font-black">{value}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-3 text-xs opacity-80">마지막 업데이트 {timeAgo(store.updatedAt)}</p>
    </section>
  );
}

function MenuSection({ store, mutate }: { store: Store; mutate: Mutate }) {
  return (
    <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-zinc-200 sm:p-6">
      <h2 className="text-lg font-black text-zinc-900">메뉴 · 남은 수량</h2>
      <p className="text-sm text-zinc-500">수량을 바꾸면 손님 지도에 바로 반영돼요.</p>

      {store.menus.length === 0 ? (
        <p className="mt-4 rounded-2xl bg-zinc-50 px-4 py-6 text-center text-sm text-zinc-500">
          아직 메뉴가 없어요. 아래에서 추가해 주세요.
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {store.menus.map((menu) => (
            <MenuRow key={menu.id} menu={menu} mutate={mutate} />
          ))}
        </ul>
      )}

      <AddMenuForm mutate={mutate} />
    </section>
  );
}

const stepBtn =
  "grid h-10 min-w-10 place-items-center rounded-xl border border-zinc-300 bg-white px-2 text-base font-bold text-zinc-700 transition hover:bg-zinc-50 active:scale-95 disabled:opacity-40";

function MenuRow({ menu, mutate }: { menu: Menu; mutate: Mutate }) {
  const path = `/api/owner/menus/${menu.id}`;
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(menu.name);
  const [price, setPrice] = useState(String(menu.price));
  // 입력 중일 때만 값을 갖고, 아니면 서버 값(menu.stock)을 그대로 보여준다.
  const [stockDraft, setStockDraft] = useState<string | null>(null);

  async function commitStock() {
    if (stockDraft === null) return;
    const next = Number(stockDraft);
    setStockDraft(null);
    if (stockDraft !== "" && Number.isInteger(next) && next !== menu.stock) {
      await mutate(path, "PATCH", { stock: next });
    }
  }

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (await mutate(path, "PATCH", { name, price: Number(price) })) setEditing(false);
  }

  async function remove() {
    if (confirm(`'${menu.name}' 메뉴를 삭제할까요?`)) await mutate(path, "DELETE");
  }

  return (
    <li className="rounded-2xl border border-zinc-200 p-3 sm:p-4">
      {editing ? (
        <form onSubmit={saveEdit} className="flex flex-wrap items-end gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={30}
            required
            className={`${inputCls} min-w-0 flex-[2_1_10rem]`}
            aria-label="메뉴 이름"
          />
          <input
            value={price}
            onChange={(e) => setPrice(e.target.value.replace(/\D/g, ""))}
            inputMode="numeric"
            required
            className={`${inputCls} min-w-0 flex-[1_1_6rem]`}
            aria-label="가격(원)"
          />
          <button type="submit" className={btnPrimary}>
            저장
          </button>
          <button
            type="button"
            className={btnGhost}
            onClick={() => {
              setEditing(false);
              setName(menu.name);
              setPrice(String(menu.price));
            }}
          >
            취소
          </button>
        </form>
      ) : (
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate font-bold text-zinc-900">{menu.name}</p>
            <p className="text-sm text-zinc-500">{formatPrice(menu.price)}</p>
          </div>
          <div className="flex shrink-0 gap-1 text-xs">
            <button onClick={() => setEditing(true)} className="rounded-lg px-2 py-1 font-semibold text-zinc-500 hover:bg-zinc-100">
              수정
            </button>
            <button onClick={remove} className="rounded-lg px-2 py-1 font-semibold text-red-500 hover:bg-red-50">
              삭제
            </button>
          </div>
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <StockBadge stock={menu.stock} />
        <div className="ml-auto flex items-center gap-1.5">
          <button
            onClick={() => mutate(path, "PATCH", { delta: -1 })}
            disabled={menu.stock <= 0}
            className={stepBtn}
            aria-label="1개 빼기"
          >
            −
          </button>
          <input
            inputMode="numeric"
            value={stockDraft ?? String(menu.stock)}
            onFocus={(e) => {
              setStockDraft(String(menu.stock));
              e.currentTarget.select();
            }}
            onChange={(e) => setStockDraft(e.target.value.replace(/\D/g, "").slice(0, 4))}
            onBlur={commitStock}
            onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
            className="h-10 w-16 rounded-xl border border-zinc-300 text-center text-base font-black outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-100"
            aria-label={`${menu.name} 남은 수량`}
          />
          <button onClick={() => mutate(path, "PATCH", { delta: 1 })} className={stepBtn} aria-label="1개 더하기">
            +
          </button>
          <button onClick={() => mutate(path, "PATCH", { delta: 10 })} className={`${stepBtn} text-sm`}>
            +10
          </button>
          <button
            onClick={() => mutate(path, "PATCH", { stock: 0 })}
            disabled={menu.stock <= 0}
            className={`${stepBtn} border-red-200 text-sm text-red-600 hover:bg-red-50`}
          >
            품절
          </button>
        </div>
      </div>
    </li>
  );
}

function AddMenuForm({ mutate }: { mutate: Mutate }) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const ok = await mutate("/api/owner/menus", "POST", {
      name,
      price: Number(price || 0),
      stock: Number(stock || 0),
    });
    if (ok) {
      setName("");
      setPrice("");
      setStock("");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 p-3 sm:p-4">
      <p className="mb-2 text-sm font-bold text-zinc-700">＋ 새 메뉴 추가</p>
      <div className="flex flex-wrap gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={30}
          required
          placeholder="메뉴 이름 (예: 슈크림 붕어빵 3개)"
          className={`${inputCls} min-w-0 flex-[3_1_12rem]`}
        />
        <input
          value={price}
          onChange={(e) => setPrice(e.target.value.replace(/\D/g, ""))}
          inputMode="numeric"
          required
          placeholder="가격(원)"
          className={`${inputCls} min-w-0 flex-[1_1_6rem]`}
        />
        <input
          value={stock}
          onChange={(e) => setStock(e.target.value.replace(/\D/g, "").slice(0, 4))}
          inputMode="numeric"
          placeholder="수량"
          className={`${inputCls} min-w-0 flex-[1_1_5rem]`}
        />
        <button type="submit" className={btnPrimary}>
          추가
        </button>
      </div>
    </form>
  );
}

function StoreInfoSection({ store, mutate, onToast }: { store: Store; mutate: Mutate; onToast: (msg: string) => void }) {
  const [name, setName] = useState(store.name);
  const [category, setCategory] = useState<Category>(store.category);
  const [address, setAddress] = useState(store.address);
  const [openHours, setOpenHours] = useState(store.openHours);
  const [description, setDescription] = useState(store.description);
  const [location, setLocation] = useState<LatLng>({ lat: store.lat, lng: store.lng });
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const ok = await mutate("/api/owner/store", "PATCH", {
      name,
      category,
      address,
      openHours,
      description,
      ...location,
    });
    setSaving(false);
    if (ok) onToast("가게 정보를 저장했어요 ✅");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-zinc-200 sm:p-6">
      <h2 className="text-lg font-black text-zinc-900">가게 정보</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="가게 이름">
          <input value={name} onChange={(e) => setName(e.target.value)} maxLength={40} required className={inputCls} />
        </Field>
        <Field label="업종">
          <select value={category} onChange={(e) => setCategory(e.target.value as Category)} className={inputCls}>
            {CATEGORY_KEYS.map((key) => (
              <option key={key} value={key}>
                {CATEGORIES[key].emoji} {CATEGORIES[key].label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="위치 설명">
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            maxLength={100}
            className={inputCls}
            placeholder="예) 시청역 4번 출구 앞"
          />
        </Field>
        <Field label="영업시간">
          <input
            value={openHours}
            onChange={(e) => setOpenHours(e.target.value)}
            maxLength={50}
            className={inputCls}
            placeholder="예) 15:00 ~ 22:00"
          />
        </Field>
      </div>
      <Field label="가게 소개">
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={200}
          rows={2}
          className={inputCls}
        />
      </Field>
      <LocationField value={location} category={category} onChange={setLocation} />
      <button type="submit" disabled={saving} className={`${btnPrimary} w-full py-3`}>
        {saving ? "저장 중…" : "가게 정보 저장"}
      </button>
    </form>
  );
}
