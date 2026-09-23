import { SellerRegistrationPage } from "@/components";
import { notFound } from "next/navigation";

export default async function SellerRegister({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const params = await searchParams;
  if (!params.token) notFound();
  return <SellerRegistrationPage token={params.token} />;
}
