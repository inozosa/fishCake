import type { Metadata } from "next";
import OwnerDashboard from "@/components/owner/OwnerDashboard";

export const metadata: Metadata = { title: "내 가게 관리" };

export default function OwnerPage() {
  return <OwnerDashboard />;
}
