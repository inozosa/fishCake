import L from "leaflet";
import { CATEGORIES, type Category } from "@/lib/categories";
import {
  formatPrice,
  placeSubline,
  reportTitle,
  stockLevel,
  stockText,
  storeStatus,
  STATUS_LABEL,
  timeAgo,
} from "@/lib/format";
// 팝업/마커는 HTML 문자열이라 사장님·손님이 입력한 값은 반드시 escapeHtml을 거친다.
import { escapeHtml } from "@/lib/html";
import type { Report, Store } from "@/lib/types";

export const TILE_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
export const TILE_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

export function storeIconHtml(store: Store, selected: boolean): string {
  const category = CATEGORIES[store.category];
  const status = storeStatus(store);
  return `<div class="fc-marker fc-${status}${selected ? " fc-selected" : ""}" style="--c:${category.color}">
      <div class="fc-pin">${category.emoji}<i class="fc-dot"></i></div>
      <div class="fc-label">${escapeHtml(store.name)}</div>
    </div>`;
}

/** 제보 위치 마커: 점선 테두리 + '제보' 태그로 인증 가게와 구분 */
export function reportIconHtml(report: Report, selected: boolean): string {
  const category = CATEGORIES[report.category];
  return `<div class="fc-marker fc-reported${selected ? " fc-selected" : ""}" style="--c:${category.color}">
      <div class="fc-pin">${category.emoji}<i class="fc-tag">제보</i></div>
      <div class="fc-label">${escapeHtml(reportTitle(report))}</div>
    </div>`;
}

export function reportPopupHtml(report: Report): string {
  const category = CATEGORIES[report.category];
  const sub = escapeHtml(placeSubline(report));

  return `<div class="fc-popup">
    <div class="fc-popup-head">
      <span style="color:${category.color}">${category.emoji} ${category.label}</span>
      <span class="fc-status fc-status-reported">📢 제보 위치 · 미인증</span>
    </div>
    <div class="fc-popup-name">${escapeHtml(reportTitle(report))}</div>
    ${sub ? `<div class="fc-popup-sub">${sub}</div>` : ""}
    <p class="fc-popup-warn">손님이 제보한 위치예요. 사장님 인증 전이라 실제 위치·영업 여부와 다를 수 있어요.</p>
    ${report.memo ? `<p class="fc-popup-memo">${escapeHtml(report.memo)}</p>` : ""}
    <div class="fc-popup-meta">${report.isMine ? "내가" : "손님"} 제보 · ${timeAgo(report.createdAt)}</div>
  </div>`;
}

export function pickerIcon(category: Category | null) {
  const color = category ? CATEGORIES[category].color : "#ea580c";
  const emoji = category ? CATEGORIES[category].emoji : "📍";
  return L.divIcon({
    className: "fc-marker-wrap",
    html: `<div class="fc-marker fc-open fc-selected" style="--c:${color}"><div class="fc-pin">${emoji}</div></div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });
}

export const myLocationIcon = L.divIcon({
  className: "fc-marker-wrap",
  html: '<div class="fc-me"></div>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

export function storePopupHtml(store: Store): string {
  const category = CATEGORIES[store.category];
  const status = storeStatus(store);
  const menus = store.menus
    .map(
      (m) => `<li>
        <span class="fc-menu-name">${escapeHtml(m.name)} <small>${formatPrice(m.price)}</small></span>
        <b class="fc-stock-${store.isOpen ? stockLevel(m.stock) : "muted"}">${stockText(m.stock)}</b>
      </li>`,
    )
    .join("");
  const sub = escapeHtml(placeSubline(store));

  return `<div class="fc-popup">
    <div class="fc-popup-head">
      <span style="color:${category.color}">${category.emoji} ${category.label}</span>
      <span class="fc-status fc-status-${status}">${STATUS_LABEL[status]}</span>
    </div>
    <div class="fc-popup-name">${escapeHtml(store.name)}</div>
    ${sub ? `<div class="fc-popup-sub">${sub}</div>` : ""}
    ${menus ? `<ul>${menus}</ul>` : '<p class="fc-popup-empty">등록된 메뉴가 없어요</p>'}
    <div class="fc-popup-meta">${timeAgo(store.updatedAt)} 업데이트${
      store.openHours ? ` · ${escapeHtml(store.openHours)}` : ""
    }</div>
  </div>`;
}
