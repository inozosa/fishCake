"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { ReportCard } from "@/components/ReportCard";
import { StoreCard, useFavoriteToggle } from "@/components/StoreCard";
import type { FocusRequest, MapTarget } from "@/components/map/MapView";
import { reportKey, storeKey } from "@/components/map/place-keys";
import { api, errorMessage } from "@/lib/api-client";
import { CATEGORIES, CATEGORY_KEYS, type Category } from "@/lib/categories";
import { DEFAULT_CENTER, distanceKm, getCurrentPosition } from "@/lib/geo";
import type { LatLng, Report, Store } from "@/lib/types";
import { ReportDialog } from "./ReportDialog";

// Leaflet은 window가 필요해서 브라우저에서만 불러온다.
const MapView = dynamic(() => import("@/components/map/MapView"), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse bg-orange-50" />,
});

const RADIUS_OPTIONS = [1, 3, 5, 10];
const REFRESH_MS = 30_000;
const zoomForRadius = (km: number) => (km <= 1 ? 15 : km <= 3 ? 14 : km <= 5 ? 13 : 12);
const isDesktop = () => window.matchMedia("(min-width: 768px)").matches;

type LocationStatus = "locating" | "ok" | "denied";

export default function HomeClient() {
  const { user } = useAuth();
  const router = useRouter();
  const [origin, setOrigin] = useState<LatLng>(DEFAULT_CENTER);
  const [userPos, setUserPos] = useState<LatLng | null>(null);
  const [locationStatus, setLocationStatus] = useState<LocationStatus>("locating");
  const [view, setView] = useState<MapTarget>({ ...DEFAULT_CENTER, zoom: 14, key: 0 });
  const [mapCenter, setMapCenter] = useState<LatLng | null>(null);
  const [radiusKm, setRadiusKm] = useState(3);

  const [stores, setStores] = useState<Store[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [category, setCategory] = useState<Category | "all">("all");
  const [openOnly, setOpenOnly] = useState(false);
  const [showReports, setShowReports] = useState(true);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [focus, setFocus] = useState<FocusRequest | null>(null);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);

  const moveTo = useCallback((pos: LatLng, zoom?: number) => {
    setOrigin(pos);
    setView({ ...pos, zoom, key: Date.now() });
  }, []);

  function changeRadius(km: number) {
    setRadiusKm(km);
    setView({ ...origin, zoom: zoomForRadius(km), key: Date.now() }); // 반경 원이 화면에 들어오게
  }

  const locate = useCallback(async () => {
    setLocationStatus("locating");
    try {
      const pos = await getCurrentPosition();
      setUserPos(pos);
      setLocationStatus("ok");
      moveTo(pos);
    } catch {
      setLocationStatus("denied");
    }
  }, [moveTo]);

  useEffect(() => {
    locate();
  }, [locate]);

  const latestRequest = useRef(0);
  const loadPlaces = useCallback(async () => {
    const requestId = ++latestRequest.current;
    // 위치를 빠르게 바꾸면 이전 요청이 늦게 도착할 수 있다 — 가장 최근 요청의 결과만 반영
    const isLatest = () => requestId === latestRequest.current;
    try {
      const qs = new URLSearchParams({ lat: String(origin.lat), lng: String(origin.lng), radius: String(radiusKm) });
      const data = await api<{ stores: Store[]; reports: Report[] }>(`/api/stores?${qs}`);
      if (!isLatest()) return;
      setStores(data.stores);
      setReports(data.reports);
      setLoadError("");
    } catch (e) {
      if (isLatest()) setLoadError(errorMessage(e));
    } finally {
      if (isLatest()) setLoading(false);
    }
  }, [origin, radiusKm]);

  // 위치·반경·로그인 상태가 바뀌면 다시 불러오고, 화면을 보고 있는 동안 30초마다·탭 복귀 시 새로고침
  useEffect(() => {
    loadPlaces();
    const timer = setInterval(() => !document.hidden && loadPlaces(), REFRESH_MS);
    const onVisible = () => !document.hidden && loadPlaces();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [loadPlaces, user?.id]);

  const onFavoriteChange = useCallback((storeId: number, isFavorite: boolean) => {
    setStores((prev) => prev.map((s) => (s.id === storeId ? { ...s, isFavorite } : s)));
  }, []);
  const toggleFavorite = useFavoriteToggle(onFavoriteChange);

  // 제보 위치는 영업 여부를 알 수 없으므로 '영업중만 보기'일 때는 숨긴다.
  const reportsVisible = showReports && !openOnly;
  const inCategory = useCallback((c: Category) => category === "all" || c === category, [category]);

  const visibleStores = useMemo(
    () =>
      stores
        .filter((s) => inCategory(s.category) && (!openOnly || s.isOpen))
        // 영업중인 가게를 먼저, 그다음 가까운 순
        .sort((a, b) => Number(b.isOpen) - Number(a.isOpen) || (a.distanceKm ?? 0) - (b.distanceKm ?? 0)),
    [stores, inCategory, openOnly],
  );
  const visibleReports = useMemo(
    () => (reportsVisible ? reports.filter((r) => inCategory(r.category)) : []),
    [reports, reportsVisible, inCategory],
  );

  const counts = useMemo(() => {
    const byCategory = Object.fromEntries(CATEGORY_KEYS.map((k) => [k, 0])) as Record<Category, number>;
    const shownStores = openOnly ? stores.filter((s) => s.isOpen) : stores;
    for (const s of shownStores) byCategory[s.category]++;
    if (reportsVisible) for (const r of reports) byCategory[r.category]++;
    return { all: shownStores.length + (reportsVisible ? reports.length : 0), ...byCategory };
  }, [stores, reports, openOnly, reportsVisible]);
  const openCount = stores.filter((s) => s.isOpen).length;

  const handleMarkerSelect = useCallback((key: string) => {
    setSelectedKey(key);
    // 데스크톱에서는 옆 목록도 해당 카드로 스크롤
    if (isDesktop()) document.getElementById(key)?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, []);
  const handleDeselect = useCallback((key: string) => setSelectedKey((cur) => (cur === key ? null : cur)), []);
  const focusPlace = useCallback((key: string) => {
    setSelectedKey(key);
    setFocus({ placeKey: key, nonce: Date.now() });
    if (!isDesktop()) window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  function openReportDialog() {
    if (!user) {
      if (confirm("가게 제보는 손님 회원만 할 수 있어요.\n로그인 페이지로 이동할까요?")) router.push("/login");
      return;
    }
    if (user.role === "owner") {
      alert("사장님 계정은 제보 대신 '내 가게 관리'에서 가게를 등록·관리해 주세요.");
      return;
    }
    setReportDialogOpen(true);
  }

  const closeReportDialog = useCallback(() => setReportDialogOpen(false), []);

  function handleReportCreated(report: Report) {
    setReportDialogOpen(false);
    setShowReports(true);
    setOpenOnly(false);
    setCategory("all");
    setReports((prev) => [{ ...report, distanceKm: distanceKm(origin, report) }, ...prev]);
    focusPlace(reportKey(report.id));
  }

  async function handleReportDelete(report: Report) {
    if (!confirm("이 제보를 삭제할까요?")) return;
    try {
      await api(`/api/reports/${report.id}`, { method: "DELETE" });
      setReports((prev) => prev.filter((r) => r.id !== report.id));
    } catch (e) {
      alert(errorMessage(e));
    }
  }

  const movedAway = mapCenter !== null && distanceKm(mapCenter, origin) > Math.max(radiusKm * 0.3, 0.3);
  const farFromDemo = distanceKm(origin, DEFAULT_CENTER) > 5;

  return (
    <div className="flex flex-col md:h-[calc(100dvh-3.5rem)] md:flex-row">
      {/* 지도 */}
      <section className="relative h-[55vh] shrink-0 md:order-2 md:h-auto md:flex-1">
        <MapView
          view={view}
          searchCenter={origin}
          radiusKm={radiusKm}
          userPos={userPos}
          stores={visibleStores}
          reports={visibleReports}
          selectedKey={selectedKey}
          focus={focus}
          onSelect={handleMarkerSelect}
          onDeselect={handleDeselect}
          onMove={setMapCenter}
        />

        <div className="pointer-events-none absolute inset-x-0 top-3 z-[1000] flex justify-center px-3">
          {movedAway && (
            <button
              onClick={() => mapCenter && setOrigin(mapCenter)}
              className="pointer-events-auto rounded-full bg-white px-4 py-2 text-sm font-bold text-orange-700 shadow-lg ring-1 ring-orange-200 transition hover:bg-orange-50"
            >
              🔄 이 지역에서 다시 찾기
            </button>
          )}
        </div>

        <div className="absolute bottom-6 left-2.5 z-[1000] flex flex-col items-start gap-2">
          <button
            onClick={openReportDialog}
            className="rounded-full bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg transition hover:bg-indigo-700 active:scale-95"
          >
            📢 가게 제보하기
          </button>
          <MapLegend />
        </div>

        <button
          onClick={locate}
          disabled={locationStatus === "locating"}
          className="absolute bottom-24 right-2.5 z-[1000] grid h-11 w-11 place-items-center rounded-xl bg-white text-xl shadow-lg ring-1 ring-black/10 transition hover:bg-zinc-50 disabled:animate-pulse"
          aria-label="내 위치로 이동"
          title="내 위치로 이동"
        >
          🎯
        </button>
      </section>

      {/* 목록 */}
      <aside className="flex min-h-0 flex-col border-zinc-200 bg-zinc-50 md:order-1 md:w-[400px] md:shrink-0 md:border-r">
        <div className="space-y-3 border-b border-zinc-200 bg-white p-4">
          <div className="flex items-end justify-between gap-2">
            <div>
              <h1 className="text-lg font-black text-zinc-900">
                {locationStatus === "ok" && !movedAway ? "내 주변" : "이 지역"} 길거리 간식
              </h1>
              <p className="text-sm text-zinc-500">
                반경 {radiusKm}km · 영업중 <b className="text-emerald-600">{openCount}</b> · 인증 가게 {stores.length} ·
                제보 {reports.length}
              </p>
            </div>
            <select
              value={radiusKm}
              onChange={(e) => changeRadius(Number(e.target.value))}
              className="rounded-lg border border-zinc-300 bg-white px-2 py-1.5 text-sm font-semibold"
              aria-label="검색 반경"
            >
              {RADIUS_OPTIONS.map((km) => (
                <option key={km} value={km}>
                  반경 {km}km
                </option>
              ))}
            </select>
          </div>

          <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-0.5">
            <CategoryChip active={category === "all"} onClick={() => setCategory("all")} label="전체" count={counts.all} />
            {CATEGORY_KEYS.map((key) => (
              <CategoryChip
                key={key}
                active={category === key}
                onClick={() => setCategory(key)}
                label={`${CATEGORIES[key].emoji} ${CATEGORIES[key].label}`}
                count={counts[key]}
              />
            ))}
          </div>

          <div className="flex flex-wrap gap-x-4 gap-y-1.5">
            <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-zinc-700">
              <input
                type="checkbox"
                checked={openOnly}
                onChange={(e) => setOpenOnly(e.target.checked)}
                className="h-4 w-4 accent-orange-600"
              />
              지금 영업중인 곳만
            </label>
            <label
              className={`flex cursor-pointer items-center gap-2 text-sm font-medium ${openOnly ? "text-zinc-400" : "text-zinc-700"}`}
              title={openOnly ? "제보 위치는 영업 여부를 알 수 없어서 '영업중만' 보기에서는 숨겨져요" : undefined}
            >
              <input
                type="checkbox"
                checked={showReports}
                disabled={openOnly}
                onChange={(e) => setShowReports(e.target.checked)}
                className="h-4 w-4 accent-indigo-600"
              />
              손님 제보 위치도 보기
            </label>
          </div>

          {locationStatus === "denied" && (
            <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
              위치 권한이 없어서 서울시청 주변을 보여드리고 있어요. 🎯 버튼으로 다시 시도할 수 있어요.
            </p>
          )}
        </div>

        <div className="flex-1 space-y-3 p-4 md:overflow-y-auto">
          {loadError && (
            <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
              {loadError}
            </p>
          )}
          {loading ? (
            Array.from({ length: 3 }, (_, i) => <div key={i} className="h-40 animate-pulse rounded-2xl bg-white" />)
          ) : visibleStores.length + visibleReports.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-300 bg-white px-4 py-10 text-center">
              <p className="text-3xl">🥲</p>
              <p className="mt-2 font-bold text-zinc-800">반경 {radiusKm}km 안에 조건에 맞는 가게가 없어요</p>
              <p className="mt-1 text-sm text-zinc-500">근처에서 본 가게가 있다면 제보해 주세요!</p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                <button
                  onClick={openReportDialog}
                  className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-bold text-white"
                >
                  📢 가게 제보하기
                </button>
                {radiusKm < 10 && (
                  <button
                    onClick={() => changeRadius(RADIUS_OPTIONS.find((km) => km > radiusKm) ?? 10)}
                    className="rounded-lg bg-orange-600 px-3 py-1.5 text-sm font-bold text-white"
                  >
                    반경 넓히기
                  </button>
                )}
                {farFromDemo && (
                  <button
                    onClick={() => moveTo(DEFAULT_CENTER, 14)}
                    className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-semibold text-zinc-700"
                  >
                    데모 지역(서울시청)으로 가기
                  </button>
                )}
              </div>
            </div>
          ) : (
            <>
              {visibleStores.map((store) => (
                <StoreCard
                  key={store.id}
                  store={store}
                  selected={storeKey(store.id) === selectedKey}
                  onSelect={(s) => focusPlace(storeKey(s.id))}
                  onToggleFavorite={toggleFavorite}
                />
              ))}

              {visibleReports.length > 0 && (
                <div className="pt-3">
                  <h2 className="text-sm font-black text-indigo-900">
                    📢 손님 제보 위치 <span className="font-bold text-indigo-400">{visibleReports.length}</span>
                  </h2>
                  <p className="mt-0.5 text-xs text-zinc-500">
                    사장님이 인증하지 않은 위치예요. 방문 전에 한 번 더 확인해 주세요.
                  </p>
                </div>
              )}
              {visibleReports.map((report) => (
                <ReportCard
                  key={report.id}
                  report={report}
                  selected={reportKey(report.id) === selectedKey}
                  onSelect={(r) => focusPlace(reportKey(r.id))}
                  onDelete={handleReportDelete}
                />
              ))}
            </>
          )}
        </div>
      </aside>

      {reportDialogOpen && (
        <ReportDialog
          // 지도를 다른 곳으로 옮겨 보고 있었다면 그곳을, 아니면 내 위치를 처음 위치로
          initialLocation={movedAway && mapCenter ? mapCenter : (userPos ?? origin)}
          onClose={closeReportDialog}
          onCreated={handleReportCreated}
        />
      )}
    </div>
  );
}

/** 마커 모양 설명 — 인증 가게(실선)와 제보 위치(점선)를 구분해 보여준다. */
function MapLegend() {
  const items = [
    { swatch: "border-solid border-zinc-500", dot: "bg-emerald-500", label: "영업중" },
    { swatch: "border-solid border-zinc-500", dot: "bg-orange-500", label: "전부 품절" },
    { swatch: "border-solid border-zinc-300 opacity-60", dot: "bg-zinc-400", label: "영업종료" },
    { swatch: "border-dashed border-indigo-500 bg-amber-50", dot: null, label: "제보 위치(미인증)" },
  ];
  return (
    <ul className="grid grid-cols-2 gap-x-3 gap-y-1 rounded-xl bg-white/95 px-3 py-2 text-[11px] font-semibold text-zinc-700 shadow-md ring-1 ring-black/10">
      {items.map((item) => (
        <li key={item.label} className="flex items-center gap-1.5">
          <span className={`relative inline-block h-3.5 w-3.5 rounded-full border-2 bg-white ${item.swatch}`}>
            {item.dot && <i className={`absolute -right-1 -top-1 h-2 w-2 rounded-full ring-1 ring-white ${item.dot}`} />}
          </span>
          {item.label}
        </li>
      ))}
    </ul>
  );
}

function CategoryChip({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-bold transition ${
        active ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
      }`}
    >
      {label} <span className={active ? "text-zinc-300" : "text-zinc-400"}>{count}</span>
    </button>
  );
}
