// Leaflet을 import하지 않는 모듈 — 서버 렌더링되는 컴포넌트에서도 안전하게 쓸 수 있다.

/** 지도 위 장소를 구분하는 키. 목록 카드의 DOM id와 같다. */
export const storeKey = (id: number) => `store-${id}`;
export const reportKey = (id: number) => `report-${id}`;
