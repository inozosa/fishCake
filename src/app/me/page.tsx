import type { Metadata } from "next";
import FavoritesList from "@/components/FavoritesList";

export const metadata: Metadata = { title: "단골 가게" };

export default function MyPage() {
  return <FavoritesList />;
}
