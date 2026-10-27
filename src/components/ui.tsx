import { stockLevel, stockText, STATUS_LABEL, type StoreStatus } from "@/lib/format";

export const inputCls =
  "w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-[15px] text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-orange-500 focus:ring-4 focus:ring-orange-100";

export const btnPrimary =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-orange-600 px-4 py-2.5 font-bold text-white transition hover:bg-orange-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50";

export const btnGhost =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-300 bg-white px-4 py-2.5 font-semibold text-zinc-700 transition hover:bg-zinc-50 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50";

export function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-zinc-800">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-zinc-500">{hint}</span>}
    </label>
  );
}

export function ErrorText({ children }: { children?: React.ReactNode }) {
  if (!children) return null;
  return (
    <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
      {children}
    </p>
  );
}

const STOCK_STYLE = {
  ok: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  low: "bg-orange-50 text-orange-700 ring-orange-200",
  out: "bg-red-50 text-red-600 ring-red-200",
} as const;

export function StockBadge({ stock, muted = false }: { stock: number; muted?: boolean }) {
  const style = muted ? "bg-zinc-100 text-zinc-400 ring-zinc-200" : STOCK_STYLE[stockLevel(stock)];
  return (
    <span className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-bold ring-1 ${style}`}>
      {stockLevel(stock) === "low" && !muted ? `마감임박 ${stock}개` : stockText(stock)}
    </span>
  );
}

const STATUS_STYLE: Record<StoreStatus, string> = {
  open: "bg-emerald-500 text-white",
  soldout: "bg-orange-500 text-white",
  closed: "bg-zinc-300 text-zinc-700",
};

export function StatusPill({ status }: { status: StoreStatus }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-bold ${STATUS_STYLE[status]}`}>
      {STATUS_LABEL[status]}
    </span>
  );
}

/** 손님 제보 위치(사장님 미인증)임을 나타내는 배지 */
export function ReportedBadge() {
  return (
    <span className="inline-flex items-center rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-bold text-indigo-700 ring-1 ring-indigo-200">
      📢 제보 위치 · 미인증
    </span>
  );
}

export function PageSpinner({ label = "불러오는 중…" }: { label?: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 py-20 text-zinc-500">
      <span className="animate-bounce text-4xl">🐟</span>
      <span className="text-sm">{label}</span>
    </div>
  );
}
