import { errorMessage } from "./api-client";

// Firebase SDK를 불러오지 않고도 쓸 수 있도록 오류 메시지만 따로 둔다.
const WRONG_LOGIN = "이메일 또는 비밀번호가 올바르지 않아요.";
const MESSAGES: Record<string, string> = {
  "auth/invalid-credential": WRONG_LOGIN,
  "auth/wrong-password": WRONG_LOGIN,
  "auth/user-not-found": WRONG_LOGIN,
  "auth/invalid-email": "이메일 형식을 확인해 주세요.",
  "auth/missing-email": "이메일을 입력해 주세요.",
  "auth/email-already-in-use": "이미 가입된 이메일이에요. 로그인하거나 비밀번호를 재설정해 주세요.",
  "auth/weak-password": "비밀번호는 8자 이상이어야 해요.",
  "auth/too-many-requests": "시도가 너무 많아요. 잠시 후 다시 하거나 비밀번호를 재설정해 주세요.",
  "auth/user-disabled": "사용이 중지된 계정이에요.",
  "auth/popup-blocked": "팝업이 차단됐어요. 브라우저에서 팝업을 허용한 뒤 다시 눌러 주세요.",
  "auth/network-request-failed": "네트워크 오류가 발생했어요. 잠시 후 다시 시도해 주세요.",
  "auth/operation-not-allowed": "Firebase 콘솔에서 이 로그인 방식이 아직 사용 설정되지 않았어요.",
  "auth/unauthorized-domain":
    "이 주소는 Firebase에 등록되지 않았어요. Firebase 콘솔 → Authentication → 설정 → 승인된 도메인에 추가해 주세요.",
  "auth/unauthorized-continue-uri":
    "이 주소는 Firebase에 등록되지 않았어요. Firebase 콘솔 → Authentication → 설정 → 승인된 도메인에 추가해 주세요.",
};

/** Firebase 오류는 한국어 안내로, 그 외(서버 API 오류 등)는 메시지 그대로. 사용자가 팝업을 닫은 경우는 "" */
export function authErrorMessage(e: unknown): string {
  const code = (e as { code?: unknown })?.code;
  if (typeof code !== "string" || !code.startsWith("auth/")) return errorMessage(e);
  if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") return "";
  return MESSAGES[code] ?? "로그인 처리 중 문제가 생겼어요. 잠시 후 다시 시도해 주세요.";
}
