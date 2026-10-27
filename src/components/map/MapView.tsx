"use client";

import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";
import { reportTitle } from "@/lib/format";
import type { LatLng, Report, Store } from "@/lib/types";
import {
  TILE_ATTRIBUTION,
  TILE_URL,
  myLocationIcon,
  reportIconHtml,
  reportPopupHtml,
  storeIconHtml,
  storePopupHtml,
} from "./leaflet-helpers";
import { reportKey, storeKey } from "./place-keys";

/** key가 바뀔 때마다 지도가 해당 위치로 이동한다. */
export interface MapTarget extends LatLng {
  zoom?: number;
  key: number;
}

/** 목록에서 장소를 눌렀을 때 지도에서 그 팝업을 여는 요청 */
export interface FocusRequest {
  placeKey: string;
  nonce: number;
}

interface Props {
  view: MapTarget;
  searchCenter: LatLng;
  radiusKm: number;
  userPos: LatLng | null;
  stores: Store[];
  reports: Report[];
  selectedKey: string | null;
  focus: FocusRequest | null;
  onSelect: (placeKey: string) => void;
  onDeselect: (placeKey: string) => void;
  onMove: (center: LatLng) => void;
}

interface Place {
  key: string;
  pos: LatLng;
  title: string;
  iconHtml: string;
  popupHtml: string;
  zIndexOffset: number;
}

interface MarkerEntry {
  marker: L.Marker;
  iconHtml: string;
  popupHtml: string;
}

export default function MapView({
  view,
  searchCenter,
  radiusKm,
  userPos,
  stores,
  reports,
  selectedKey,
  focus,
  onSelect,
  onDeselect,
  onMove,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const placeLayerRef = useRef<L.LayerGroup | null>(null);
  const markersRef = useRef(new Map<string, MarkerEntry>());
  const radiusRef = useRef<L.Circle | null>(null);
  const meRef = useRef<L.Marker | null>(null);
  const callbacks = useRef({ onSelect, onDeselect, onMove });
  useEffect(() => {
    callbacks.current = { onSelect, onDeselect, onMove };
  });

  // 지도 생성 (마운트 시 한 번)
  useEffect(() => {
    const container = containerRef.current!;
    const map = L.map(container, { zoomControl: false }).setView([view.lat, view.lng], view.zoom ?? 14);
    L.control.zoom({ position: "bottomright" }).addTo(map);
    L.tileLayer(TILE_URL, { maxZoom: 19, attribution: TILE_ATTRIBUTION }).addTo(map);
    placeLayerRef.current = L.layerGroup().addTo(map);

    // 많이 축소하면 가게 이름표를 숨겨서 겹치지 않게
    const syncZoomClass = () => container.classList.toggle("fc-zoomed-out", map.getZoom() < 15);
    map.on("zoomend", syncZoomClass);
    map.on("moveend", () => {
      const c = map.getCenter();
      callbacks.current.onMove({ lat: c.lat, lng: c.lng });
    });
    syncZoomClass();
    mapRef.current = map;

    const markers = markersRef.current;
    return () => {
      map.remove();
      mapRef.current = null;
      placeLayerRef.current = null;
      radiusRef.current = null;
      meRef.current = null;
      markers.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 초기 위치만 사용
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (map) map.flyTo([view.lat, view.lng], view.zoom ?? map.getZoom(), { duration: 0.8 });
  }, [view]);

  // 검색 반경 원
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    radiusRef.current?.remove();
    radiusRef.current = L.circle([searchCenter.lat, searchCenter.lng], {
      radius: radiusKm * 1000,
      color: "#ea580c",
      weight: 1.5,
      dashArray: "6 6",
      fillColor: "#fb923c",
      fillOpacity: 0.05,
      interactive: false,
    }).addTo(map);
  }, [searchCenter, radiusKm]);

  // 내 위치 (파란 점)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    meRef.current?.remove();
    meRef.current = userPos
      ? L.marker([userPos.lat, userPos.lng], {
          icon: myLocationIcon,
          interactive: false,
          keyboard: false,
          zIndexOffset: 2000,
        }).addTo(map)
      : null;
  }, [userPos]);

  // 마커: 30초마다 새 데이터가 와도 열린 팝업이 닫히지 않도록 바뀐 것만 갱신
  useEffect(() => {
    const layer = placeLayerRef.current;
    if (!layer) return;
    const markers = markersRef.current;

    // 인증 가게가 제보 위치보다 위에 그려지도록 zIndex를 나눈다.
    const places: Place[] = [
      ...stores.map((s) => {
        const key = storeKey(s.id);
        const selected = key === selectedKey;
        return {
          key,
          pos: s,
          title: s.name,
          iconHtml: storeIconHtml(s, selected),
          popupHtml: storePopupHtml(s),
          zIndexOffset: selected ? 1500 : s.isOpen ? 500 : 100,
        };
      }),
      ...reports.map((r) => {
        const key = reportKey(r.id);
        const selected = key === selectedKey;
        return {
          key,
          pos: r,
          title: `${reportTitle(r)} (제보 위치)`,
          iconHtml: reportIconHtml(r, selected),
          popupHtml: reportPopupHtml(r),
          zIndexOffset: selected ? 1500 : 0,
        };
      }),
    ];

    const nextKeys = new Set(places.map((p) => p.key));
    for (const [key, entry] of markers) {
      if (!nextKeys.has(key)) {
        layer.removeLayer(entry.marker);
        markers.delete(key);
      }
    }

    for (const place of places) {
      const icon = () =>
        L.divIcon({
          className: "fc-marker-wrap",
          html: place.iconHtml,
          iconSize: [40, 40],
          iconAnchor: [20, 20],
          popupAnchor: [0, -20],
        });

      const entry = markers.get(place.key);
      if (!entry) {
        const marker = L.marker([place.pos.lat, place.pos.lng], {
          icon: icon(),
          riseOnHover: true,
          zIndexOffset: place.zIndexOffset,
          title: place.title,
        })
          .bindPopup(place.popupHtml, { minWidth: 230, maxWidth: 280, autoPanPadding: L.point(24, 24) })
          .on("click", () => callbacks.current.onSelect(place.key))
          .on("popupclose", () => callbacks.current.onDeselect(place.key))
          .addTo(layer);
        markers.set(place.key, { marker, iconHtml: place.iconHtml, popupHtml: place.popupHtml });
        continue;
      }

      entry.marker.setLatLng([place.pos.lat, place.pos.lng]).setZIndexOffset(place.zIndexOffset);
      if (entry.iconHtml !== place.iconHtml) {
        entry.marker.setIcon(icon());
        entry.iconHtml = place.iconHtml;
      }
      if (entry.popupHtml !== place.popupHtml) {
        entry.marker.setPopupContent(place.popupHtml);
        entry.popupHtml = place.popupHtml;
      }
    }
  }, [stores, reports, selectedKey]);

  useEffect(() => {
    const map = mapRef.current;
    const entry = focus && markersRef.current.get(focus.placeKey);
    if (!map || !entry) return;
    map.setView(entry.marker.getLatLng(), Math.max(map.getZoom(), 16), { animate: false });
    entry.marker.openPopup();
  }, [focus]);

  return <div ref={containerRef} className="h-full w-full" />;
}
