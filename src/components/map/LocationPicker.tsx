"use client";

import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";
import type { Category } from "@/lib/categories";
import { DEFAULT_CENTER } from "@/lib/geo";
import type { LatLng } from "@/lib/types";
import { TILE_ATTRIBUTION, TILE_URL, pickerIcon } from "./leaflet-helpers";

interface Props {
  value: LatLng | null;
  category: Category | null;
  onChange: (value: LatLng) => void;
}

/** 지도를 클릭하거나 핀을 드래그해서 위치를 고르는 지도 */
export default function LocationPicker({ value, category, onChange }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  });

  useEffect(() => {
    const start = value ?? DEFAULT_CENTER;
    const map = L.map(containerRef.current!, { scrollWheelZoom: "center" }).setView([start.lat, start.lng], 16);
    L.tileLayer(TILE_URL, { maxZoom: 19, attribution: TILE_ATTRIBUTION }).addTo(map);
    map.on("click", (e: L.LeafletMouseEvent) => onChangeRef.current({ lat: e.latlng.lat, lng: e.latlng.lng }));
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 초기 위치만 사용
  }, []);

  // 핀: 처음 위치가 정해지면 만들고, 이후엔 위치만 옮긴다 (아이콘은 아래 effect에서 업종이 바뀔 때만)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !value) return;
    if (!markerRef.current) {
      markerRef.current = L.marker([value.lat, value.lng], { draggable: true, icon: pickerIcon(category) })
        .on("dragend", (e) => {
          const p = (e.target as L.Marker).getLatLng();
          onChangeRef.current({ lat: p.lat, lng: p.lng });
        })
        .addTo(map);
    } else {
      markerRef.current.setLatLng([value.lat, value.lng]);
    }
    if (!map.getBounds().contains([value.lat, value.lng])) map.setView([value.lat, value.lng], 17);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- category는 핀을 처음 만들 때만 필요
  }, [value]);

  useEffect(() => {
    markerRef.current?.setIcon(pickerIcon(category));
  }, [category]);

  return <div ref={containerRef} className="h-full w-full" />;
}
