"use client";

import { useEffect, useRef, useState } from "react";
import { CategoryPicker } from "@/components/CategoryPicker";
import { LocationField } from "@/components/map/LocationField";
import { ErrorText, Field, btnGhost, btnPrimary, inputCls } from "@/components/ui";
import { api, errorMessage } from "@/lib/api-client";
import type { Category } from "@/lib/categories";
import type { LatLng, Report } from "@/lib/types";

interface Props {
  initialLocation: LatLng;
  onClose: () => void;
  onCreated: (report: Report) => void;
}

export function ReportDialog({ initialLocation, onClose, onCreated }: Props) {
  const [category, setCategory] = useState<Category | null>(null);
  const [location, setLocation] = useState<LatLng>(initialLocation);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [memo, setMemo] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  // 바깥(어두운 배경)을 눌렀다 뗐을 때만 닫는다. 지도 핀을 끌다가 바깥에서 손을 떼도 닫히지 않게.
  const pressedOutside = useRef(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!category) return setError("어떤 가게인지 업종을 골라 주세요.");
    setSubmitting(true);
    setError("");
    try {
      const { report } = await api<{ report: Report }>("/api/reports", {
        method: "POST",
        body: { category, name, address, memo, ...location },
      });
      onCreated(report);
    } catch (err) {
      setError(errorMessage(err));
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[1300] flex items-end justify-center bg-black/40 sm:items-center sm:p-4"
      onPointerDown={(e) => (pressedOutside.current = e.target === e.currentTarget)}
      onClick={(e) => pressedOutside.current && e.target === e.currentTarget && onClose()}
    >
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby="report-title"
        onSubmit={handleSubmit}
        className="max-h-[92dvh] w-full max-w-lg space-y-4 overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-3xl sm:p-6"
      >
        <div>
          <h2 id="report-title" className="text-xl font-black text-zinc-900">
            📢 가게 제보하기
          </h2>
          <p className="mt-1 text-sm text-zinc-500">길에서 본 붕어빵·닭꼬치·포장마차를 알려 주세요.</p>
        </div>

        <p className="rounded-xl bg-indigo-50 px-3 py-2.5 text-xs leading-relaxed text-indigo-800">
          제보한 곳은 지도에 <b>&lsquo;제보 위치 · 미인증&rsquo;</b>으로 표시돼요. 사장님이 직접 등록한 가게와 구분되고,
          남은 수량은 표시되지 않아요.
        </p>

        <CategoryPicker legend="어떤 가게인가요?" value={category} onChange={setCategory} />
        <LocationField label="제보할 위치" value={location} category={category} onChange={setLocation} />

        <Field label="가게 이름 (모르면 비워 두세요)">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={40}
            className={inputCls}
            placeholder="예) 시청역 붕어빵 아저씨"
          />
        </Field>
        <Field label="위치 설명 (선택)">
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            maxLength={100}
            className={inputCls}
            placeholder="예) 버스정류장 옆, 편의점 앞"
          />
        </Field>
        <Field label="메모 (선택)" hint="메뉴·가격, 주로 나오는 시간대 등">
          <textarea
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            maxLength={200}
            rows={3}
            className={inputCls}
            placeholder={"예) 팥붕 3개 2,000원\n저녁에만 나오세요"}
          />
        </Field>

        <ErrorText>{error}</ErrorText>
        <div className="flex gap-2">
          <button type="button" onClick={onClose} className={`${btnGhost} flex-1`}>
            취소
          </button>
          <button type="submit" disabled={submitting} className={`${btnPrimary} flex-[2]`}>
            {submitting ? "제보하는 중…" : "제보하기"}
          </button>
        </div>
      </form>
    </div>
  );
}
