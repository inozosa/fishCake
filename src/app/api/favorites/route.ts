import { requireUser } from "@/lib/auth";
import { findFavoriteStores } from "@/lib/stores";

export async function GET() {
  const guard = await requireUser("customer");
  if (!guard.ok) return guard.response;
  return Response.json({ stores: await findFavoriteStores(guard.value.id) });
}
