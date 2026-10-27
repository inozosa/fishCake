"use client";

import { placeSubline, reportTitle, timeAgo } from "@/lib/format";
import type { Report } from "@/lib/types";
import { PlaceCard } from "./PlaceCard";
import { reportKey } from "./map/place-keys";
import { ReportedBadge } from "./ui";

interface Props {
  report: Report;
  selected?: boolean;
  onSelect?: (report: Report) => void;
  onDelete?: (report: Report) => void;
}

/** 손님 제보 위치 카드 — 점선 테두리와 '미인증' 안내로 사장님 인증 가게와 구분한다. */
export function ReportCard({ report, selected, onSelect, onDelete }: Props) {
  return (
    <PlaceCard
      id={reportKey(report.id)}
      variant="report"
      category={report.category}
      title={reportTitle(report)}
      subline={placeSubline(report)}
      badge={<ReportedBadge />}
      selected={selected}
      onSelect={onSelect && (() => onSelect(report))}
      action={
        report.isMine &&
        onDelete && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(report);
            }}
            className="shrink-0 rounded-lg px-2 py-1 text-xs font-semibold text-zinc-400 hover:bg-red-50 hover:text-red-500"
          >
            삭제
          </button>
        )
      }
    >
      {report.memo && (
        <p className="mt-3 whitespace-pre-line rounded-xl bg-zinc-50 px-3 py-2 text-sm text-zinc-700">{report.memo}</p>
      )}
      <p className="mt-2 text-xs text-indigo-700/80">
        ⓘ 손님이 제보한 위치예요. 사장님 인증 전이라 실제 위치·영업 여부와 다를 수 있고, 남은 수량은 알 수 없어요.
      </p>
      <p className="mt-1 text-[11px] text-zinc-400">
        {report.isMine ? "내가 제보" : "손님 제보"} · {timeAgo(report.createdAt)}
      </p>
    </PlaceCard>
  );
}
