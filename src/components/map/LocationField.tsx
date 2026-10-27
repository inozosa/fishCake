"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { errorMessage } from "@/lib/api-client";
import type { Category } from "@/lib/categories";
import { getCurrentPosition } from "@/lib/geo";
import type { LatLng } from "@/lib/types";

// Leaflet은 window가 필요해서 브라우저에서만 불러온다.
const LocationPicker = dynamic(() => import("./LocationPicker"), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse bg-orange-50" />,
});

interface Props {
  label?: string;
  value: LatLng | null;
  category: Category | null;
  onChange: (value: LatLng) => void;
}

export function LocationField({ label = "가게 위치", value, category, onChange }: Props) {
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState("");

  async function fillCurrentLocation() {
    setLocating(true);
    setError("");
    try {
      onChange(await getCurrentPosition());
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLocating(false);
    }
  }

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <span className="text-sm font-semibold text-zinc-800">{label}</span>
        <button
          type="button"
          onClick={fillCurrentLocation}
          disabled={locating}
          className="rounded-lg bg-orange-50 px-2.5 py-1 text-xs font-bold text-orange-700 transition hover:bg-orange-100 disabled:opacity-50"
        >
          {locating ? "위치 찾는 중…" : "📍 현재 위치로 설정"}
        </button>
      </div>
      <div className="h-64 overflow-hidden rounded-xl border border-zinc-300">
        <LocationPicker value={value} category={category} onChange={onChange} />
      </div>
      <p className={`mt-1 text-xs ${error ? "text-red-600" : "text-zinc-500"}`}>
        {error ||
          (value
            ? `지도를 클릭하거나 핀을 끌어서 옮길 수 있어요 (${value.lat.toFixed(5)}, ${value.lng.toFixed(5)})`
            : "지도를 클릭해서 위치를 찍어 주세요.")}
      </p>
    </div>
  );
}
