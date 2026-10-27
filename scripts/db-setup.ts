// 테이블 생성(멱등) + 빈 DB면 데모 데이터. `npm run db:setup`으로 실행하고, `npm run build` 전에도 자동 실행된다.
import { neon } from "@neondatabase/serverless";
import { migrate } from "../src/lib/schema";
import { linkDemoAccounts } from "../src/lib/seed";

async function main() {
  // 스키마 변경은 커넥션 풀러를 거치지 않는 직접 연결을 쓰는 게 Neon 권장 사항
  const url = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;
  if (!url) {
    console.warn("⚠️  DATABASE_URL이 없어서 DB 설정을 건너뜁니다.");
    return;
  }
  const sql = neon(url);
  const { seeded } = await migrate(sql);
  console.log(`✓ DB 스키마 준비 완료${seeded ? " (빈 DB라 데모 데이터를 넣었어요)" : ""}`);

  // 데모 계정 로그인 준비는 실패해도 빌드를 막지 않는다 (데모 계정으로 로그인만 안 될 뿐)
  try {
    const linked = await linkDemoAccounts(sql);
    if (linked) console.log(`✓ 데모 계정 ${linked}개를 Firebase에 연결했어요`);
  } catch (e) {
    const hint = String(e).includes("OPERATION_NOT_ALLOWED")
      ? " → Firebase 콘솔에서 이메일/비밀번호 로그인을 사용 설정해 주세요."
      : "";
    console.warn(`⚠️  데모 계정을 Firebase에 연결하지 못했어요: ${(e as Error).message}${hint}`);
  }
}

main().catch((e) => {
  console.error("✗ DB 설정 실패:", e);
  process.exit(1);
});
