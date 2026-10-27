import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";

/**
 * 서버 전용 Firebase 관리자. 비밀번호 재설정 링크를 직접 만들 때만 쓴다
 * (Firebase 기본 메일 대신 우리 디자인의 메일을 보내려고). 서비스 계정 키가 없으면 null.
 */
export function getAdminAuth(): Auth | null {
  const key = process.env.FIREBASE_SERVICE_ACCOUNT_KEY; // 서비스 계정 JSON 파일 내용 그대로
  if (!key) return null;
  return getAuth(getApps()[0] ?? initializeApp({ credential: cert(JSON.parse(key)) }));
}
