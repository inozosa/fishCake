// 브라우저 전용. 번들 크기를 줄이려고 로그인·가입 버튼을 누를 때 동적으로 import 한다.
import { getApps, initializeApp } from "firebase/app";
import {
  GoogleAuthProvider,
  browserPopupRedirectResolver,
  createUserWithEmailAndPassword,
  inMemoryPersistence,
  initializeAuth,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  type Auth,
  type User,
} from "firebase/auth";
import { firebaseConfig } from "./firebase-config";

/** Firebase가 확인해 준 신원. 서버는 idToken을 검증해서 우리 회원으로 로그인시킨다. */
export interface FirebaseIdentity {
  idToken: string;
  email: string;
  name: string;
}

let auth: Auth | undefined;

// 비밀번호 확인은 Firebase가 맡고, 로그인 상태는 서버 세션 쿠키로 관리한다.
// 그래서 Firebase 로그인 정보는 브라우저에 저장하지 않는다(메모리에만, 같은 탭 안에서만 유지).
function getFirebaseAuth(): Auth {
  if (!auth) {
    auth = initializeAuth(getApps()[0] ?? initializeApp(firebaseConfig), {
      persistence: inMemoryPersistence,
      popupRedirectResolver: browserPopupRedirectResolver,
    });
    auth.languageCode = "ko"; // Google 로그인 창 등 Firebase 화면을 한국어로
  }
  return auth;
}

async function toIdentity(user: User): Promise<FirebaseIdentity> {
  return { idToken: await user.getIdToken(), email: user.email ?? "", name: user.displayName ?? "" };
}

export async function signInWithGoogle(): Promise<FirebaseIdentity> {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  const { user } = await signInWithPopup(getFirebaseAuth(), provider);
  return toIdentity(user);
}

export async function signInWithEmail(email: string, password: string): Promise<FirebaseIdentity> {
  const { user } = await signInWithEmailAndPassword(getFirebaseAuth(), email, password);
  return toIdentity(user);
}

/**
 * 이메일 계정을 만든다. 이미 있으면 같은 비밀번호로 로그인해서 이어간다
 * (가입 도중 서버 쪽에서 실패해 Firebase 계정만 남은 경우 다시 시도할 수 있게).
 */
export async function signUpWithEmail(email: string, password: string): Promise<FirebaseIdentity> {
  try {
    const { user } = await createUserWithEmailAndPassword(getFirebaseAuth(), email, password);
    return toIdentity(user);
  } catch (e) {
    if ((e as { code?: string }).code !== "auth/email-already-in-use") throw e;
    return signInWithEmail(email, password).catch(() => Promise.reject(e)); // 비밀번호가 다르면 '이미 가입된 이메일'
  }
}

/** 이 탭에서 방금 Firebase 로그인한 사용자 (로그인 → 사장님 가입 화면으로 넘어올 때 이어받기용) */
export async function currentIdentity(): Promise<FirebaseIdentity | null> {
  const user = auth?.currentUser;
  return user ? toIdentity(user) : null; // getIdToken()은 만료됐으면 알아서 새로 받는다
}

/** 서버 세션이 만들어진 뒤에는 Firebase 쪽 로그인은 필요 없으므로 정리한다. */
export async function clearFirebaseSession() {
  if (auth?.currentUser) await signOut(auth);
}
