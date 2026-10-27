import { readFirebaseIdentity, startSession } from "@/lib/auth";
import { DEFAULT_MENUS } from "@/lib/categories";
import { getSql, isUniqueViolation } from "@/lib/db";
import { cleanText, jsonError, readJson } from "@/lib/http";
import { parseStoreInput, type NewStoreFields } from "@/lib/inputs";
import { insertOwnerWithStore } from "@/lib/owner-signup";
import type { PublicUser } from "@/lib/types";

/**
 * 회원가입. 브라우저에서 Firebase 계정(Google 또는 이메일·비밀번호)을 먼저 만들고, 그 ID 토큰(idToken)으로 가입한다.
 * 비밀번호는 Firebase가 관리하므로 우리 DB에는 저장하지 않는다.
 */
export async function POST(req: Request) {
  const body = await readJson(req);
  if (!body) return jsonError("잘못된 요청이에요.");

  const role = body.role;
  if (role !== "owner" && role !== "customer") return jsonError("가입 유형을 선택해 주세요.");

  const guard = await readFirebaseIdentity(body.idToken);
  if (!guard.ok) return guard.response;
  const { email, uid, name: firebaseName } = guard.value;

  const name = cleanText(body.name, 30) || firebaseName.slice(0, 30);
  const phone = cleanText(body.phone, 20);
  if (!name) return jsonError(role === "owner" ? "대표자 이름을 입력해 주세요." : "닉네임을 입력해 주세요.");

  let store: NewStoreFields | null = null;
  if (role === "owner") {
    if (!phone) return jsonError("연락처를 입력해 주세요.");
    const input = body.store && typeof body.store === "object" ? (body.store as Record<string, unknown>) : {};
    const parsed = parseStoreInput(input, false);
    if (!parsed.ok) return jsonError(parsed.error);
    store = parsed.fields as NewStoreFields;
  }

  const sql = getSql();
  let rows: { id: number }[];
  try {
    rows = (
      store
        ? await insertOwnerWithStore(sql, {
            email,
            firebaseUid: uid,
            name,
            phone,
            store: {
              name: store.name,
              category: store.category,
              description: store.description ?? "",
              address: store.address ?? "",
              openHours: store.openHours ?? "",
              lat: store.lat,
              lng: store.lng,
              isOpen: false,
            },
            // 업종별 기본 메뉴를 수량 0으로 미리 넣어 둔다.
            menus: DEFAULT_MENUS[store.category].map((m) => ({ ...m, stock: 0 })),
          })
        : await sql`INSERT INTO users (email, firebase_uid, name, phone, role)
                    VALUES (${email}, ${uid}, ${name}, ${phone || null}, 'customer')
                    RETURNING id`
    ) as { id: number }[];
  } catch (e) {
    if (isUniqueViolation(e)) return jsonError("이미 가입된 계정이에요. 로그인해 주세요.", 409);
    throw e;
  }

  const userId = rows[0].id;
  await startSession(userId);
  const user: PublicUser = { id: userId, email, name, role };
  return Response.json({ user }, { status: 201 });
}
